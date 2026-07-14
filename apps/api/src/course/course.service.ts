import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { similarity } from '../catalog/core/levenshtein.util';
import { findOrCreateSemester } from '../common/semester.util';
import { PrismaService } from '../prisma/prisma.service';

const DUPLICATE_MERGE_THRESHOLD = 0.85;

export interface CreateCourseBody {
  semesterLabel?: string;
  name?: string;
  code?: string | null;
  category?: string | null;
  credit?: number;
}

export interface UpdateCourseBody {
  name?: string;
  category?: string | null;
  credit?: number;
  general?: boolean;
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  async createCourse(profile: Profile, body: CreateCourseBody) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('요청 본문이 올바르지 않습니다.');
    }
    if (!body.semesterLabel || !body.semesterLabel.trim()) {
      throw new BadRequestException('학기 라벨(semesterLabel)은 필수입니다.');
    }
    if (!body.name || !body.name.trim() || !isNonNegativeInt(body.credit)) {
      throw new BadRequestException('과목명(name)과 학점(credit)은 필수입니다.');
    }

    const semester = await findOrCreateSemester(this.prisma, profile.id, body.semesterLabel.trim(), false);

    const course = await this.prisma.course.create({
      data: {
        semesterId: semester.id,
        name: body.name.trim(),
        code: body.code ?? null,
        category: body.category ?? null,
        credit: body.credit,
        general: false,
        source: 'MANUAL',
      },
    });

    return { courseId: course.id, semesterId: semester.id };
  }

  async updateCourse(profile: Profile, courseId: number, body: UpdateCourseBody) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('요청 본문이 올바르지 않습니다.');
    }
    const course = await this.findOwnedCourse(profile.id, courseId);

    const data: Record<string, string | number | boolean | null> = {};
    if ('name' in body) {
      if (!body.name || !body.name.trim()) {
        throw new BadRequestException('과목명(name)은 비어 있을 수 없습니다.');
      }
      data.name = body.name.trim();
    }
    if ('category' in body) {
      data.category = body.category ?? null;
    }
    if ('credit' in body) {
      if (!isNonNegativeInt(body.credit)) {
        throw new BadRequestException('학점(credit) 값이 올바르지 않습니다.');
      }
      data.credit = body.credit;
    }
    if ('general' in body) {
      if (typeof body.general !== 'boolean') {
        throw new BadRequestException('일반 일정(general) 값이 올바르지 않습니다.');
      }
      data.general = body.general;
    }

    await this.prisma.course.update({ where: { id: course.id }, data });
  }

  async deleteCourse(profile: Profile, courseId: number) {
    const course = await this.findOwnedCourse(profile.id, courseId);
    await this.prisma.course.delete({ where: { id: course.id } });
  }

  async listDuplicates(profile: Profile) {
    const courses = await this.prisma.course.findMany({
      where: { semester: { profileId: profile.id }, general: false },
      orderBy: [{ semester: { sortOrder: 'asc' } }, { id: 'asc' }],
    });

    // 1차: 과목명 exact match로 그룹핑
    const exactGroups = new Map<string, number[]>();
    for (const c of courses) {
      const ids = exactGroups.get(c.name) ?? [];
      ids.push(c.id);
      exactGroups.set(c.name, ids);
    }

    // 2차: 오탈자 대응을 위해 Levenshtein 유사도가 높은 그룹끼리 병합(첫 등장 이름을 대표명으로 채택)
    const mergedGroups = new Map<string, number[]>();
    for (const [name, ids] of exactGroups) {
      const canonical = [...mergedGroups.keys()].find((existing) => similarity(name, existing) >= DUPLICATE_MERGE_THRESHOLD);
      const key = canonical ?? name;
      mergedGroups.set(key, [...(mergedGroups.get(key) ?? []), ...ids]);
    }

    const duplicateEntries = [...mergedGroups.entries()].filter(([, ids]) => ids.length > 1);

    const duplicateGroups = await Promise.all(
      duplicateEntries.map(async ([name, courseIds]) => {
        const retakeGroup = await this.prisma.retakeGroup.upsert({
          where: { profileId_groupKey: { profileId: profile.id, groupKey: name } },
          update: {},
          create: { profileId: profile.id, groupKey: name, name, retakeAccepted: true },
        });
        return {
          groupKey: retakeGroup.groupKey,
          name: retakeGroup.name,
          courseIds,
          retakeAccepted: retakeGroup.retakeAccepted,
        };
      }),
    );

    return { duplicateGroups };
  }

  async toggleRetake(profile: Profile, groupKey: string, retakeAccepted: unknown) {
    if (typeof retakeAccepted !== 'boolean') {
      throw new BadRequestException('재수강 인정 여부(retakeAccepted) 값이 올바르지 않습니다.');
    }

    const existing = await this.prisma.retakeGroup.findUnique({
      where: { profileId_groupKey: { profileId: profile.id, groupKey } },
    });
    if (!existing) throw new NotFoundException('존재하지 않는 중복 그룹입니다.');

    await this.prisma.retakeGroup.update({ where: { id: existing.id }, data: { retakeAccepted } });
  }

  async setSubstitution(profile: Profile, courseId: number, catalogCourseId: unknown) {
    if (!isPositiveInt(catalogCourseId)) {
      throw new BadRequestException('연결할 요람 과목(catalogCourseId)은 필수입니다.');
    }

    const course = await this.findOwnedCourse(profile.id, courseId);
    const catalogCourse = await this.prisma.catalogCourse.findUnique({ where: { id: catalogCourseId } });
    if (!catalogCourse) throw new NotFoundException('존재하지 않는 과목 정보입니다.');

    await this.prisma.course.update({
      where: { id: course.id },
      data: { substitutionCatalogCourseId: catalogCourse.id },
    });

    return { courseId: course.id, matchedName: catalogCourse.name };
  }

  async removeSubstitution(profile: Profile, courseId: number) {
    const course = await this.findOwnedCourse(profile.id, courseId);
    if (!course.substitutionCatalogCourseId) {
      throw new NotFoundException('존재하지 않는 과목 정보입니다.');
    }

    await this.prisma.course.update({ where: { id: course.id }, data: { substitutionCatalogCourseId: null } });
  }

  private async findOwnedCourse(profileId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { semester: true },
    });
    if (!course || course.semester.profileId !== profileId) {
      throw new NotFoundException('존재하지 않는 과목 정보입니다.');
    }
    return course;
  }
}
