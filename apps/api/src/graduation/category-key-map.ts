// CatalogGraduationRequirement.creditBreakdown의 JSON 키 → Course.category 원문 문자열 매핑.
// 학과마다 creditBreakdown 키 구조가 다르다(실 데이터 확인, [[구현 방식]] 3.4 참고):
// - 이수구분 카테고리 단위는 Course.category 문자열과 직접 매칭 가능해 구조화된 pass/fail 판정이 가능하다.
//   크롤러(academic-requirement-parser.ts)가 학과 사이트 표의 실제 한글 헤더를 키로 그대로 쓰므로
//   (예: "기초필수"/"중핵교양"/"전공기초"/"전공필수"/"전공선택") 대부분 과목 category와 유사하거나
//   동일하다. 초기 3개 학과(컴공/경영/수학과)는 크롤러 도입 전 영어 키로 수동 입력했던 데이터라
//   두 체계를 모두 지원한다.
// - 프로그램 단위(수학과형: majorDeepMin/doubleMajorMin/minorMin — 전공심화/복수전공/부전공 소속 학점)는
//   원래 Course에 학과 FK가 없어 과목이 어느 전공 소속인지 구분 못 해 매핑이 없었으나, FIX#28에서
//   과목 category 자체가 "제1전공선택/필수" vs "제2전공선택/필수"로 재분류되면서(everytime.service.ts
//   reclassifyCategory) 이제 구분 가능해졌다 — majorDeepMin/doubleMajorMin 둘 다 "그 슬롯의 전공
//   과목"이라는 같은 카테고리 집합을 쓰고(둘의 차이는 학점 기준(threshold)일 뿐, 어떤 과목이 세는지는
//   같음), graduation.service.ts가 programType/슬롯에 따라 둘 중 적용되는 쪽만 골라 보여준다.
//   minorMin(부전공)은 부전공 과목에 대한 별도 category 라벨이 없어 여전히 매핑하지 않는다.
export const CATEGORY_KEY_MAP: Record<string, string[]> = {
  // 크롤러(academic-requirement-parser.ts)가 실제 학과 사이트 표 헤더를 그대로 키로 쓴 경우
  기초필수: ['기초교양필수'],
  중핵교양: ['중핵교양필수'],
  // 타전공선택(제1/2전공 어디에도 속하지 않는 학과 개설 과목, everytime.service.ts 참고)은
  // 자유선택교양과 동일하게 취급 — 실제 학과 규정도 "부전공 포기 시 자유선택 교양과목으로 인정"처럼
  // 전공 외 과목을 자유선택 학점으로 계산하는 관례를 따른다.
  '교양이수학점 계': ['기초교양필수', '중핵교양필수', '자유선택교양', '타전공선택'],
  전공기초: ['전공기초'],
  전공필수: ['제1전공필수'],
  전공선택: ['제1전공선택'],
  '전공이수학점 계': ['제1전공선택', '제1전공필수'],

  // 크롤러 도입 이전 컴공/경영/수학과 수동 입력 데이터(영어 키)
  generalBasicRequired: ['기초교양필수'],
  generalCore: ['중핵교양필수'],
  general: ['자유선택교양', '타전공선택'],
  majorBasic: ['전공기초'],
  major: ['제1전공선택', '제1전공필수'],

  // 수학과형 프로그램 단위 키 — 위 주석 참고. majorDeepMin(전공심화 기준)과 doubleMajorMin(복수전공
  // 기준)은 실제로 세는 과목(제1/2전공선택+필수)이 같고 학점 기준만 다르므로 카테고리 집합은 동일하게 둔다.
  majorDeepMin: ['제1전공선택', '제1전공필수'],
  doubleMajorMin: ['제1전공선택', '제1전공필수'],
};

// 복수전공(제2전공) 요건을 같은 creditBreakdown 키 체계로 재사용하기 위한 슬롯 치환.
// CATEGORY_KEY_MAP의 카테고리 문자열은 원래 "이 학과가 제1전공일 때"를 기준으로 적혀 있어
// ('제1전공선택' 등), 같은 학과를 제2전공(복수전공)으로 보는 시점엔 '제1전공' 접두어를
// '제2전공'으로 치환해서 조회한다. 접두어가 없는 카테고리(기초교양필수 등)는 그대로 둔다.
export function resolveCategories(key: string, slot: 'FIRST' | 'SECOND'): string[] | undefined {
  const categories = CATEGORY_KEY_MAP[key];
  if (!categories) return undefined;
  if (slot === 'FIRST') return categories;
  return categories.map((c) => c.replace('제1전공', '제2전공'));
}

// 사람이 읽을 라벨. 매핑 없는 키는 라벨도 없어 그대로 키를 노출.
export const CATEGORY_KEY_LABEL: Record<string, string> = {
  기초필수: '기초교양필수',
  중핵교양: '중핵교양필수',
  '교양이수학점 계': '교양 이수학점 계',
  전공기초: '전공기초',
  전공필수: '전공필수',
  전공선택: '전공선택',
  '전공이수학점 계': '전공 이수학점 계',
  '교직과정, 자유선택, 부전공, 기타': '교직과정/자유선택/부전공/기타',

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

  // 미디어기술콘텐츠학과 트랙별 세부 인정 영역(TrackCourseRecognition.area와 동일 문자열) — 이
  // 키들은 CATEGORY_KEY_MAP에 없어(과목 category로 직접 매칭 불가) graduation.service.ts가
  // resolveTrackAreaBreakdown()으로 트랙별 인정과목을 따로 집계해서 채워준다.
  기획창작영역: '기획창작 영역',
  콘텐츠비즈니스영역: '콘텐츠비즈니스 영역',
  기초영역: '기초 영역',
  필수영역: '필수 영역',
  응용영역: '응용 영역',
};
