import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { groupDuplicateCourses } from '../common/retake-grouping.util';
import { findOrCreateSemester } from '../common/semester.util';
import { PrismaService } from '../prisma/prisma.service';

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

    // groupKey는 과목명이 아니라 그룹 내 가장 이른(=가장 최근 학기의) 과목 courseId로 고정한다 —
    // 과목명이 나중에 바뀌거나(수정 API) 병합 그룹이 재구성돼도 동일한 RetakeGroup 로우를 계속 참조하기 위함.
    // graduation 계산 엔진도 동일한 groupDuplicateCourses를 사용해 같은 groupKey를 계산한다.
    const groups = groupDuplicateCourses(courses);
    const duplicateEntries = [...groups.entries()].filter(([, list]) => list.length > 1);

    const duplicateGroups = await Promise.all(
      duplicateEntries.map(async ([groupKey, list]) => {
        const name = list[0].name;
        const courseIds = list.map((c) => c.id);
        const retakeGroup = await this.prisma.retakeGroup.upsert({
          where: { profileId_groupKey: { profileId: profile.id, groupKey } },
          update: { name },
          create: { profileId: profile.id, groupKey, name, retakeAccepted: true },
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
    if (catalogCourse.departmentId !== profile.majorDepartmentId) {
      throw new NotFoundException('존재하지 않는 과목 정보입니다.');
    }

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
