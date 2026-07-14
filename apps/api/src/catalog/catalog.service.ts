import { Injectable } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { similarity } from '../common/levenshtein.util';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_LIMIT = 5;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async searchCourses(profile: Profile, query: string | undefined, limit: number | undefined) {
    const take = limit && Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT;

    const catalogCourses = await this.prisma.catalogCourse.findMany({
      where: { departmentId: profile.majorDepartmentId },
    });

    const trimmedQuery = query?.trim();

    const scored = catalogCourses
      .map((c) => ({ course: c, score: trimmedQuery ? similarity(trimmedQuery, c.name) : 1 }))
      .sort((a, b) => (trimmedQuery ? b.score - a.score : a.course.name.localeCompare(b.course.name)));

    return {
      results: scored.slice(0, take).map(({ course, score }) => ({
        catalogCourseId: course.id,
        name: course.name,
        code: course.code,
        category: course.category,
        similarity: Number(score.toFixed(2)),
      })),
    };
  }
}
