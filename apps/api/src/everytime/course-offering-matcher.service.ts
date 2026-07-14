import { Injectable } from '@nestjs/common';
import { similarity } from '../common/levenshtein.util';
import { PrismaService } from '../prisma/prisma.service';

const NAME_MATCH_THRESHOLD = 0.85;

export interface MatchedCourseOffering {
  code: string;
  credit: number;
  category: string;
}

@Injectable()
export class CourseOfferingMatcherService {
  constructor(private readonly prisma: PrismaService) {}

  async match(params: {
    universityId: number;
    year: number;
    term: string;
    name: string;
    professor: string | null;
  }): Promise<MatchedCourseOffering | null> {
    const offerings = await this.prisma.courseOffering.findMany({
      where: { universityId: params.universityId, year: params.year, term: params.term },
    });
    if (offerings.length === 0) return null;

    const exact = offerings.filter((o) => o.name === params.name);
    const candidates =
      exact.length > 0 ? exact : offerings.filter((o) => similarity(params.name, o.name) >= NAME_MATCH_THRESHOLD);
    if (candidates.length === 0) return null;

    // 같은 과목명을 여러 학과가 서로 다른 분반으로 공동 개설하는 경우가 있어(예: 컴퓨터와프로그래밍1)
    // 교수명으로 후보를 좁힌다 — 다만 code는 어차피 과목 단위로 동일하므로 교수 매칭에 실패해도
    // exact name match 후보가 있으면 그중 하나를 채택해도 무방하다.
    const byProfessor = params.professor ? candidates.filter((o) => o.professor === params.professor) : [];
    const chosen = byProfessor[0] ?? candidates[0];

    return { code: chosen.code, credit: chosen.credit, category: chosen.category };
  }
}
