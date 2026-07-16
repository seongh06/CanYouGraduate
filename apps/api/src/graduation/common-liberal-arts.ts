// 가톨릭대 전체 공통 기초교양필수·중핵교양선택필수 이수학점 — 학과별 creditBreakdown JSON에 매번
// 중복해서 넣지 않고 학번(admissionYear) 기준 고정 테이블로 관리한다(이슈 #51, 결과화면에서 학과
// 종속 요건처럼 보이던 문제를 이 표 기준 공통 카드로 분리).
//
// [Claude Code 세션, WebSearch 조사 기반(catholic.ac.kr curriculum1_YYYY.do / curriculum2_YYYY.do,
// 2026-07-16 직접 확인) — catholic.ac.kr 원문 대조는 했으나 학교 공식 검수는 아니므로 정확도 재확인
// 권장. 2018학번 이전은 커리큘럼 체계 자체가 달라 데이터 없음으로 처리(2018~2026학번만 지원).
// 사회과학/경영/생활과학계열의 2023학번 기초교양 13학점 예외처럼 학과 수가 너무 많아 이번 배치에서
// 다루지 못한 세부 계열 예외도 있다 — 그 경우 계열 기본값으로 폴백된다.

export interface CommonLiberalArtsRequirement {
  basicRequired: number; // 기초교양필수
  coreRequired: number; // 중핵교양선택필수
}

const DEFAULT_BY_YEAR: Record<number, CommonLiberalArtsRequirement> = {
  2018: { basicRequired: 16, coreRequired: 12 },
  2019: { basicRequired: 16, coreRequired: 12 },
  2020: { basicRequired: 13, coreRequired: 12 },
  2021: { basicRequired: 13, coreRequired: 12 },
  2022: { basicRequired: 13, coreRequired: 15 },
  2023: { basicRequired: 16, coreRequired: 15 },
  2024: { basicRequired: 11, coreRequired: 18 },
  2025: { basicRequired: 11, coreRequired: 18 },
  2026: { basicRequired: 11, coreRequired: 18 },
};

// 학과명 단위 예외 — 확인된 것만 부분 필드로 덮어쓴다(명시 안 된 필드/학번은 계열 기본값 사용).
const DEPARTMENT_OVERRIDES: Record<string, Partial<Record<number, Partial<CommonLiberalArtsRequirement>>>> = {
  글로벌경영학과: {
    2022: { basicRequired: 14 },
    2023: { basicRequired: 11 },
    2024: { basicRequired: 9, coreRequired: 12 },
    2025: { basicRequired: 9, coreRequired: 12 },
    2026: { basicRequired: 9, coreRequired: 12 },
  },
  약학과: {
    2020: { basicRequired: 4, coreRequired: 0 },
    2021: { basicRequired: 4, coreRequired: 0 },
  },
};

export function getCommonLiberalArtsRequirement(
  admissionYear: number,
  departmentName: string,
): CommonLiberalArtsRequirement | null {
  const base = DEFAULT_BY_YEAR[admissionYear];
  if (!base) return null;

  const override = DEPARTMENT_OVERRIDES[departmentName]?.[admissionYear];
  return override ? { ...base, ...override } : base;
}
