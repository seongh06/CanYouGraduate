import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Profile } from '@prisma/client';
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
