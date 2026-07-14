// CatalogGraduationRequirement.creditBreakdown의 JSON 키 → Course.category 원문 문자열 매핑.
// 학과마다 creditBreakdown 키 구조가 다르다(실 데이터 확인, [[구현 방식]] 3.4 참고):
// - 이수구분 카테고리 단위(컴공형: general/generalBasicRequired/generalCore/majorBasic/major)는
//   Course.category 문자열과 직접 매칭 가능해 구조화된 pass/fail 판정이 가능하다.
// - 프로그램 단위(수학과형: majorDeepMin/doubleMajorMin/minorMin — 전공심화/복수전공/부전공 소속 학점)는
//   Course에 학과 FK가 없고 category가 "1전공기준"으로만 표기돼 있어 과목이 어느 전공 소속인지
//   구분할 수 없다 — 매핑을 만들지 않고 정보성으로만 남긴다.
export const CATEGORY_KEY_MAP: Record<string, string[]> = {
  generalBasicRequired: ['기초교양필수'],
  generalCore: ['중핵교양필수'],
  general: ['자유선택교양'],
  majorBasic: ['전공기초'],
  major: ['제1전공선택', '제1전공필수'],
};

// 사람이 읽을 라벨. 매핑 없는 키는 라벨도 없어 그대로 키를 노출.
export const CATEGORY_KEY_LABEL: Record<string, string> = {
  generalBasicRequired: '기초교양필수',
  generalCore: '중핵교양필수',
  general: '자유선택교양',
  majorBasic: '전공기초',
  major: '전공(필수+선택)',
  majorDeepMin: '전공심화 최소학점',
  majorDeepRequired: '전공심화 필수학점',
  doubleMajorMin: '복수전공 최소학점',
  doubleMajorRequired: '복수전공 필수학점',
  minorMin: '부전공 최소학점',
};
