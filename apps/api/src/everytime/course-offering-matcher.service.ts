import { Injectable } from '@nestjs/common';
import { similarity } from '../common/levenshtein.util';
import { PrismaService } from '../prisma/prisma.service';

const NAME_MATCH_THRESHOLD = 0.85;

export interface MatchedCourseOffering {
  code: string;
  credit: number;
  category: string;
  departmentName: string;
  foreignLanguageType: string | null;
}

@Injectable()
export class CourseOfferingMatcherService {
  constructor(private readonly prisma: PrismaService) {}

  // 같은 학기의 크롤링 과목 전체를 한 번에 받아 offerings 조회를 학기당 1회로 끝낸다
  // (과목마다 개별 조회하면 학기 하나에 수천 건짜리 개설과목 목록을 과목 수만큼 중복 조회하게 됨).
  async matchMany(
    universityId: number,
    year: number,
    term: string,
    courses: Array<{ name: string; professor: string | null }>,
  ): Promise<Array<MatchedCourseOffering | null>> {
    const offerings = await this.prisma.courseOffering.findMany({
      where: { universityId, year, term },
    });
    if (offerings.length === 0) return courses.map(() => null);

    return courses.map((course) => {
      const exact = offerings.filter((o) => o.name === course.name);
      const candidates =
        exact.length > 0 ? exact : offerings.filter((o) => similarity(course.name, o.name) >= NAME_MATCH_THRESHOLD);
      if (candidates.length === 0) return null;

      // 같은 과목명을 여러 학과가 서로 다른 분반으로 공동 개설하는 경우가 있어(예: 컴퓨터와프로그래밍1)
      // 교수명으로 후보를 좁힌다 — 다만 code는 어차피 과목 단위로 동일하므로 교수 매칭에 실패해도
      // exact name match 후보가 있으면 그중 하나를 채택해도 무방하다.
      const byProfessor = course.professor ? candidates.filter((o) => o.professor === course.professor) : [];
      const chosen = byProfessor[0] ?? candidates[0];

      return {
        code: chosen.code,
        credit: chosen.credit,
        category: chosen.category,
        departmentName: chosen.departmentName,
        foreignLanguageType: chosen.foreignLanguageType,
      };
    });
  }
}
