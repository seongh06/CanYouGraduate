import { Injectable } from '@nestjs/common';
import { similarity } from '../common/levenshtein.util';
import { PrismaService } from '../prisma/prisma.service';

const NAME_MATCH_THRESHOLD = 0.85;

// 담당교수 정규화 — 에브리타임 크롤링 결과와 트리니티 엑셀의 교수명 표기가 미묘하게 다른 경우가
// 있다(공백, "교수"/"강사"/"겸임교수" 등 직함 접미사 유무). 이 차이 때문에 교수명 매칭이
// 실패하면 같은 과목명의 여러 분반(그중 하나만 외국어강의인 경우가 대부분) 중 아무거나
// 골라버리는 문제로 이어진다(사용자 확인, 이슈 #53 후속) — 정규화해서 매칭 성공률을 높인다.
const PROFESSOR_TITLE_SUFFIX = /(명예교수|겸임교수|초빙교수|객원교수|강의전담교수|부교수|조교수|교수|강사)$/;
function normalizeProfessorName(name: string): string {
  return name.replace(/\s+/g, '').replace(PROFESSOR_TITLE_SUFFIX, '');
}

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
      const byProfessor = course.professor
        ? candidates.filter((o) => o.professor && normalizeProfessorName(o.professor) === normalizeProfessorName(course.professor!))
        : [];
      const chosen = byProfessor[0] ?? candidates[0];

      // foreignLanguageType은 분반마다 다른 경우가 대부분이라(예: 4개 분반 중 1개만 외국어강의)
      // 교수명으로 정확히 좁혀지지 않았는데 후보들 값이 서로 다르면 추측하지 않고 null로 둔다
      // (사용자 확인, 이슈 #53 후속 — "이름+교수 매칭됐는데 외국어 수업인 경우에만 체크되게").
      const distinctForeignLanguageTypes = new Set(candidates.map((o) => o.foreignLanguageType ?? null));
      const foreignLanguageType =
        byProfessor.length > 0 || distinctForeignLanguageTypes.size === 1 ? chosen.foreignLanguageType : null;

      return {
        code: chosen.code,
        credit: chosen.credit,
        category: chosen.category,
        departmentName: chosen.departmentName,
        foreignLanguageType,
      };
    });
  }
}
