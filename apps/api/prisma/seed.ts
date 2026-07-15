import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 계열(College) — 대학 공식 계열번호를 그대로 id로 사용. 성심/성의/성신 캠퍼스 구분은
// [[대학_학사_데이터_크롤링_파이프라인_및_폐지_과목_처리_설계서_v2]] 1.4 참고.
const COLLEGES: Array<{ id: number; name: string; campus?: string }> = [
  { id: 1, name: '인문사회계열' },
  { id: 3, name: '자연공학계열' },
  { id: 5, name: '자유전공' },
  { id: 6, name: '융합전공' },
  { id: 7, name: '교직과정' },
  { id: 8, name: '신학대학', campus: '성신' },
  { id: 9, name: '예체능계열' },
  { id: 10, name: '경영대학' },
  { id: 11, name: '약학대학' },
  { id: 12, name: '간호대학', campus: '성의' },
  { id: 13, name: '의과대학', campus: '성의' },
  { id: 14, name: '바이오헬스융합대학' },
  { id: 15, name: 'AI전자정보융합대학' },
  { id: 16, name: '학부대학' },
];

type UrlPattern = 'standard' | 'subdirectory' | 'other-campus';

interface DepartmentSeed {
  id: number;
  collegeId: number;
  name: string;
  domainSlug: string;
  baseUrl: string;
  urlPattern?: UrlPattern;
  catalogReady?: boolean;
  // 학사정보 페이지가 표준 course/academic.do 경로가 아닌 학과(패턴 ⑦)만 채움.
  academicRequirementUrl?: string;
  // 학위를 수여하는 실제 학과가 아니라 행정단위인 경우(패턴 ⑱) — CatalogGraduationRequirement 시딩 대상 아님.
  isAdministrativeUnit?: boolean;
}

// 가톨릭대_학과_계열_매핑.xlsx "학과매핑" 시트 52행 그대로 옮김(실제확인된 URL 컬럼 기준).
// 컴퓨터정보공학부(101)/경영학과(102)/데이터사이언스(205)는 기존 시드 ID를 그대로 유지.
const DEPARTMENTS: DepartmentSeed[] = [
  // college 1: 인문사회계열
  {
    id: 300,
    collegeId: 1,
    name: '국어국문학과',
    domainSlug: 'korean',
    baseUrl: 'https://korean.catholic.ac.kr',
    // 이 학과만 슬러그가 academic.do가 아니라 academic-information.do (패턴 ⑦).
    academicRequirementUrl: 'https://korean.catholic.ac.kr/korean/course/academic-information.do',
  },
  { id: 301, collegeId: 1, name: '철학과', domainSlug: 'philosophy', baseUrl: 'https://philosophy.catholic.ac.kr' },
  {
    id: 302,
    collegeId: 1,
    name: '국사학과',
    domainSlug: 'koreanhistory',
    baseUrl: 'https://koreanhistory.catholic.ac.kr',
  },
  { id: 303, collegeId: 1, name: '영어영문학부', domainSlug: 'english', baseUrl: 'https://english.catholic.ac.kr' },
  { id: 304, collegeId: 1, name: '중국언어문화학과', domainSlug: 'cn', baseUrl: 'https://cn.catholic.ac.kr' },
  {
    id: 305,
    collegeId: 1,
    name: '일어일본문화학과',
    domainSlug: 'japanese',
    baseUrl: 'https://japanese.catholic.ac.kr',
  },
  {
    id: 306,
    collegeId: 1,
    name: '프랑스어문화학과',
    domainSlug: 'french',
    baseUrl: 'https://french.catholic.ac.kr',
  },
  {
    id: 307,
    collegeId: 1,
    name: '사회복지학과',
    domainSlug: 'socialwelfare',
    baseUrl: 'https://socialwelfare.catholic.ac.kr',
  },
  {
    id: 308,
    collegeId: 1,
    name: '심리학과',
    domainSlug: 'psychology',
    baseUrl: 'https://psychology.catholic.ac.kr',
  },
  { id: 309, collegeId: 1, name: '사회학과', domainSlug: 'sociology', baseUrl: 'https://sociology.catholic.ac.kr' },
  { id: 310, collegeId: 1, name: '아동학과', domainSlug: 'children', baseUrl: 'https://children.catholic.ac.kr' },
  { id: 311, collegeId: 1, name: '특수교육과', domainSlug: 'sped', baseUrl: 'https://sped.catholic.ac.kr' },
  { id: 312, collegeId: 1, name: '국제학부', domainSlug: 'is', baseUrl: 'https://is.catholic.ac.kr' },
  { id: 313, collegeId: 1, name: '법학과', domainSlug: 'law', baseUrl: 'https://law.catholic.ac.kr' },
  { id: 314, collegeId: 1, name: '경제학과', domainSlug: 'economics', baseUrl: 'https://economics.catholic.ac.kr' },
  { id: 315, collegeId: 1, name: '행정학과', domainSlug: 'pa', baseUrl: 'https://pa.catholic.ac.kr' },
  {
    id: 316,
    collegeId: 1,
    name: '글로벌경영학과',
    domainSlug: 'globalbiz',
    baseUrl: 'https://globalbiz.catholic.ac.kr',
  },
  { id: 317, collegeId: 1, name: '한국어문화학과', domainSlug: 'klc', baseUrl: 'https://klc.catholic.ac.kr' },

  // college 3: 자연공학계열
  { id: 318, collegeId: 3, name: '화학과', domainSlug: 'chemistry', baseUrl: 'https://chemistry.catholic.ac.kr' },
  { id: 319, collegeId: 3, name: '수학과', domainSlug: 'math', baseUrl: 'https://math.catholic.ac.kr' },
  { id: 320, collegeId: 3, name: '물리학과', domainSlug: 'physics', baseUrl: 'https://physics.catholic.ac.kr' },
  {
    id: 321,
    collegeId: 3,
    name: '에너지환경공학과',
    domainSlug: 'envi',
    baseUrl: 'https://envi.catholic.ac.kr',
  },
  {
    id: 322,
    collegeId: 3,
    name: '공간디자인·소비자학과',
    domainSlug: 'design',
    baseUrl: 'https://design.catholic.ac.kr',
  },
  { id: 323, collegeId: 3, name: '의류학과', domainSlug: 'clothing', baseUrl: 'https://clothing.catholic.ac.kr' },
  { id: 324, collegeId: 3, name: '식품영양학과', domainSlug: 'fn', baseUrl: 'https://fn.catholic.ac.kr' },

  // college 5~7: 자유전공/융합전공/교직과정 — 셋 다 학위를 수여하는 실제 학과가 아니라 행정단위(패턴 ⑱).
  // 자유전공학부는 최종 선택한 학과 요건을 그대로 따르고, 융합전공학부는 9~10개 개별 융복합전공의 상위
  // 관리 학부(각 융복합전공은 미개별조사), 교직과는 소속 학과 요건 위에 얹히는 교원자격증 취득과정이라
  // 셋 다 CatalogGraduationRequirement를 갖지 않는다.
  {
    id: 325,
    collegeId: 5,
    name: '자유전공학부',
    domainSlug: 'liberal',
    baseUrl: 'https://liberal.catholic.ac.kr',
    isAdministrativeUnit: true,
  },
  {
    id: 326,
    collegeId: 6,
    name: '융합전공학부',
    domainSlug: 'major-convergence',
    baseUrl: 'https://major-convergence.catholic.ac.kr',
    isAdministrativeUnit: true,
  },
  {
    id: 327,
    collegeId: 7,
    name: '교직과',
    domainSlug: 'teaching',
    baseUrl: 'https://teaching.catholic.ac.kr',
    isAdministrativeUnit: true,
  },

  // college 8: 신학대학(성신교정) — 도메인 패턴이 다름(자동 크롤링 제외)
  {
    id: 328,
    collegeId: 8,
    name: '신학대학(성신)',
    domainSlug: 'songsin',
    baseUrl: 'https://songsin.catholic.ac.kr/ko/academics/theology.do',
    urlPattern: 'other-campus',
  },

  // college 9: 예체능계열
  { id: 329, collegeId: 9, name: '음악과', domainSlug: 'music', baseUrl: 'https://music.catholic.ac.kr' },
  {
    id: 330,
    collegeId: 9,
    name: '성악과',
    domainSlug: 'voice',
    baseUrl: 'https://voice.catholic.ac.kr',
    // 학부 학사정보가 course/academic.do가 아니라 graduate/academic.do 경로에 게재됨(패턴 ⑦, 원문 미대조 — 재확인 권장).
    academicRequirementUrl: 'https://voice.catholic.ac.kr/voice/graduate/academic.do',
  },
  {
    id: 331,
    collegeId: 9,
    name: '예술미디어융합학과',
    domainSlug: 'gamc',
    baseUrl: 'https://gamc.catholic.ac.kr',
  },

  // college 10: 경영대학 (business=102 기존 ID 유지)
  { id: 332, collegeId: 10, name: '회계학과', domainSlug: 'accounting', baseUrl: 'https://accounting.catholic.ac.kr' },
  { id: 333, collegeId: 10, name: '국제경영학과', domainSlug: 'gbs', baseUrl: 'https://gbs.catholic.ac.kr' },
  { id: 334, collegeId: 10, name: '세무회계금융학과', domainSlug: 'gbs', baseUrl: 'https://gbs.catholic.ac.kr' },
  { id: 335, collegeId: 10, name: 'IT파이낸스학과', domainSlug: 'gbs', baseUrl: 'https://gbs.catholic.ac.kr' },

  // college 11~13: 약학대학 / 간호대학(성의) / 의과대학(성의)
  { id: 336, collegeId: 11, name: '약학과', domainSlug: 'pharmacy', baseUrl: 'https://pharmacy.catholic.ac.kr' },
  {
    id: 337,
    collegeId: 12,
    name: '간호학과',
    domainSlug: 'nursing',
    baseUrl: 'https://nursing.catholic.ac.kr',
    urlPattern: 'other-campus',
  },
  {
    id: 338,
    collegeId: 13,
    name: '의과대학',
    domainSlug: 'medicine',
    baseUrl: 'https://medicine.catholic.ac.kr',
    urlPattern: 'other-campus',
  },

  // college 14: 바이오헬스융합대학
  { id: 339, collegeId: 14, name: '생명공학과', domainSlug: 'biotech', baseUrl: 'https://biotech.catholic.ac.kr' },
  {
    id: 340,
    collegeId: 14,
    name: '바이오메디컬화학공학과',
    domainSlug: 'bmce',
    baseUrl: 'https://bmce.catholic.ac.kr',
  },
  {
    id: 341,
    collegeId: 14,
    name: '바이오로직스공학부',
    domainSlug: 'BLE',
    baseUrl: 'https://www.catholic.ac.kr/BLE/index.do',
    urlPattern: 'subdirectory',
  },
  { id: 342, collegeId: 14, name: 'AI의공학과', domainSlug: 'aibme', baseUrl: 'https://aibme.catholic.ac.kr' },
  { id: 343, collegeId: 14, name: '의생명과학과', domainSlug: 'mbs', baseUrl: 'https://mbs.catholic.ac.kr' },
  {
    id: 344,
    collegeId: 14,
    name: '바이오메디컬소프트웨어학과',
    domainSlug: 'bmsw',
    baseUrl: 'https://bmsw.catholic.ac.kr',
  },

  // college 15: AI전자정보융합대학 (csie=101, datascience=205 기존 ID 유지)
  {
    id: 345,
    collegeId: 15,
    name: '미디어기술콘텐츠학과',
    domainSlug: 'mtc',
    baseUrl: 'https://mtc.catholic.ac.kr',
  },
  {
    id: 346,
    collegeId: 15,
    name: '정보통신전자공학부',
    domainSlug: 'ice',
    baseUrl: 'https://ice.catholic.ac.kr',
  },
  { id: 347, collegeId: 15, name: '인공지능학과', domainSlug: 'ai', baseUrl: 'https://ai.catholic.ac.kr' },

  // college 16: 학부대학 (신입생 소속 행정단위, 실제 학과 아님)
  {
    id: 348,
    collegeId: 16,
    name: '학부대학',
    domainSlug: 'catholic-college',
    baseUrl: 'https://catholic-college.catholic.ac.kr',
    isAdministrativeUnit: true,
  },
];

async function main() {
  const university = await prisma.university.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: '가톨릭대학교 성심교정', supported: true },
  });

  for (const college of COLLEGES) {
    await prisma.college.upsert({
      where: { id: college.id },
      update: {},
      create: { id: college.id, universityId: university.id, name: college.name, campus: college.campus ?? '성심' },
    });
  }

  // 컴퓨터정보공학부/경영학과/데이터사이언스 — 기존 ID 유지, 실제 확인된 도메인/URL로 정정
  const cse = await prisma.department.upsert({
    where: { id: 101 },
    update: { collegeId: 15, domainSlug: 'csie', baseUrl: 'https://csie.catholic.ac.kr', catalogReady: true },
    create: {
      id: 101,
      universityId: university.id,
      collegeId: 15,
      name: '컴퓨터정보공학부',
      domainSlug: 'csie',
      baseUrl: 'https://csie.catholic.ac.kr',
      catalogReady: true,
    },
  });

  await prisma.department.upsert({
    where: { id: 102 },
    update: { collegeId: 10, domainSlug: 'business', baseUrl: 'https://business.catholic.ac.kr', catalogReady: true },
    create: {
      id: 102,
      universityId: university.id,
      collegeId: 10,
      name: '경영학과',
      domainSlug: 'business',
      baseUrl: 'https://business.catholic.ac.kr',
      catalogReady: true,
    },
  });

  await prisma.department.upsert({
    where: { id: 205 },
    update: { collegeId: 15, domainSlug: 'datascience', baseUrl: 'https://datascience.catholic.ac.kr' },
    create: {
      id: 205,
      universityId: university.id,
      collegeId: 15,
      name: '데이터사이언스학과',
      domainSlug: 'datascience',
      baseUrl: 'https://datascience.catholic.ac.kr',
    },
  });

  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: {},
      create: {
        id: dept.id,
        universityId: university.id,
        collegeId: dept.collegeId,
        name: dept.name,
        domainSlug: dept.domainSlug,
        baseUrl: dept.baseUrl,
        urlPattern: dept.urlPattern ?? 'standard',
        catalogReady: dept.catalogReady ?? false,
        academicRequirementUrl: dept.academicRequirementUrl ?? null,
        isAdministrativeUnit: dept.isAdministrativeUnit ?? false,
      },
    });
  }

  await prisma.track.upsert({
    where: { id: 11 },
    update: {},
    create: { id: 11, departmentId: cse.id, name: '심화 전공 트랙', requiredCourseCount: 3 },
  });

  // mtc(미디어기술콘텐츠학과)·is(국제학부) — 트랙별로 졸업요건(특히 대체인정 옵션)이 갈리는 학과(패턴 ①).
  // requiredCourseCount는 이 트랙들에 의미가 없어(구 "트랙별 필수과목" 모델 잔재) null로 둔다.
  const MTC_DEPT_ID = 345;
  const IS_DEPT_ID = 312;
  const TRACKS: Array<{ id: number; departmentId: number; name: string }> = [
    { id: 12, departmentId: MTC_DEPT_ID, name: '트랙미이수' },
    { id: 13, departmentId: MTC_DEPT_ID, name: '문화콘텐츠트랙' },
    { id: 14, departmentId: MTC_DEPT_ID, name: '미디어공학트랙' },
    { id: 15, departmentId: MTC_DEPT_ID, name: '테크니컬아티스트트랙' },
    { id: 16, departmentId: IS_DEPT_ID, name: '미국학' },
    { id: 17, departmentId: IS_DEPT_ID, name: '중국학' },
    { id: 18, departmentId: IS_DEPT_ID, name: '국제관계학' },
    { id: 19, departmentId: IS_DEPT_ID, name: '국제통상학' },
  ];
  for (const track of TRACKS) {
    await prisma.track.upsert({
      where: { id: track.id },
      update: {},
      create: { id: track.id, departmentId: track.departmentId, name: track.name, requiredCourseCount: null },
    });
  }

  await prisma.catalogCatholicCheck.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, universityId: university.id, key: 'humanities', label: '인간학 이수 여부' },
  });
  await prisma.catalogCatholicCheck.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, universityId: university.id, key: 'catholicSpirit', label: '가톨릭 정신 관련 지정 과목 이수 여부' },
  });

  // 졸업요건: 가톨릭대_학과별_졸업요건_스키마_v3.xlsx "졸업요건" 시트(43개 학과 전수조사) 그대로 반영.
  // 자유전공학부/융합전공학부/교직과(패턴 ⑱, isAdministrativeUnit=true)는 시딩 대상이 아니고,
  // gamc(예술미디어융합학과)·klc(한국어문화학과)는 v3 스키마설계노트에서 조사 대상 제외로 명시되어 데이터가 없다.
  //
  // 필드 관례:
  // - cohortLabel: 적용학번 컬럼 원문 그대로(파싱 안 되는 표현 대비 source of truth), admissionYearFrom/To는 best-effort 파싱.
  // - comprehensiveExam: { hasExam: 졸업시험유무 원문, detail: 졸업시험상세 원문 } 이 기본형. csie/math/design처럼
  //   기존에 구조화되어 있던 3건만 원래 구조를 유지한다.
  // - substitutionRules: 대체_어학성적/자격증/공모전수상/졸업논문/기타 5개 컬럼을 각각 LANGUAGE/CERTIFICATE/
  //   COMPETITION/THESIS/OTHER 타입 항목으로 옮긴 것 — "정보없음"/"해당없음" 컬럼은 항목을 만들지 않는다.
  // - mandatoryRequirements: 비고/상세에 "모두 충족"·"병렬조건"·"별도 필수"처럼 대체가 아니라 AND로 명시된
  //   항목만 채운다(패턴 ⑤⑨⑪⑭). 애매하면 unset(→JsonNull, "이 축으로 아직 구분 안 함")으로 둔다.
  // - dataSource/verified: PAGE_DIRECT/true가 기본. WebSearch 스니펫만으로 조사한 14개 행(cn·japanese·gbs×3·
  //   pharmacy×2·biotech×2·sped·is×4, 패턴 ⑮)만 SEARCH_SNIPPET/false. NOT_FOUND(사회복지·음악)·
  //   NOTICE_ATTACHMENT(식품영양)·NOT_YET_ESTABLISHED(AI의공학·바이오메디컬소프트웨어·바이오로직스공학부, 패턴 ⑲)는 개별 지정.
  interface GraduationRequirementSeed {
    id: number;
    departmentId: number;
    trackId?: number;
    scope?: 'ALL' | 'FIRST_MAJOR' | 'DOUBLE_MAJOR';
    cohortLabel: string;
    admissionYearFrom?: number;
    admissionYearTo?: number;
    basis?: 'ADMISSION_YEAR' | 'GRADUATION_DATE';
    graduationDateFrom?: string;
    totalCreditMin?: number;
    creditBreakdown?: Prisma.InputJsonValue;
    scoringMethod?: 'PASS_FAIL' | 'POINT_ACCUMULATION';
    comprehensiveExam?: Prisma.InputJsonValue;
    scoreItems?: Prisma.InputJsonValue;
    pointThreshold?: number;
    mandatoryRequirements?: Prisma.InputJsonValue;
    substitutionRules?: Prisma.InputJsonValue;
    languageScoreStandard?: Prisma.InputJsonValue;
    thesisOptional?: boolean;
    trackRestrictionNote?: string;
    dataSource?: 'PAGE_DIRECT' | 'NOTICE_ATTACHMENT' | 'SEARCH_SNIPPET' | 'NOT_FOUND' | 'NOT_YET_ESTABLISHED';
    verified?: boolean;
    sourceUrl?: string;
    attachmentUrl?: string;
    notes?: string;
  }

  const SNIPPET_NOTE_PREFIX =
    '[Claude Code 세션, WebSearch 스니펫 기반, catholic.ac.kr 직접 미검증 — 정확도 재확인 권장] ';

  const GRADUATION_REQUIREMENTS: GraduationRequirementSeed[] = [
    // ── 컴퓨터정보공학부 (기존 3건 유지, id만 재부여) ──
    {
      id: 1,
      departmentId: 101,
      cohortLabel: '전체(공통)',
      admissionYearFrom: 2018,
      totalCreditMin: 130,
      creditBreakdown: { general: 25, generalBasicRequired: 16, generalCore: 9, majorBasic: 15, major: 36 },
      comprehensiveExam: {
        majorRequiredCount: 4,
        doubleMajorRequiredCount: 3,
        detail:
          '심화전공 4과목·복수전공 3과목 선택, 신청과목 전부 합격 필요(1차 A, 2차 B). 종합시험 과목: 자료구조·운영체제·데이터통신 등 18개 과목 중 선택',
      },
      substitutionRules: [
        { type: 'LANGUAGE', condition: 'TOEIC 801점 이상', waives: 3 },
        { type: 'LANGUAGE', condition: 'TOEIC 701~800점', waives: 2 },
        { type: 'LANGUAGE', condition: 'TOEIC 601~700점', waives: 1 },
        { type: 'THESIS', condition: '지도교수 인정 학회발표 논문 제출자, 학술연구논문 장학생(심사통과) → A등급 대체' },
        { type: 'CERTIFICATE', condition: '국가공인 1급/국제공인자격증(정보처리기사·OCP·빅데이터분석기사·정보보안기사 등) → A등급 대체' },
        { type: 'COMPETITION', condition: 'IT관련 전국/교내외 대회 입상(ACM ICPC 등) → A등급 대체' },
        { type: 'OTHER', condition: '상기 조건과 동등하다고 학부회의 개별심사 통과 시 인정' },
      ],
      thesisOptional: true,
      trackRestrictionNote: '없음(트랙 구분 자체가 없음)',
      sourceUrl: 'https://csie.catholic.ac.kr/csie/course/academic.do',
    },
    // ── 미디어기술콘텐츠학과 (트랙 4종, 패턴 ①) ──
    {
      id: 2,
      departmentId: 345,
      trackId: 12,
      cohortLabel: '전체(공통)',
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 66, doubleMajorMin: 36 },
      comprehensiveExam: { hasExam: 'N', detail: '졸업종합시험 폐지됨(어학성적만 제출). 구술시험도 폐지됨(과거엔 있었음).' },
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition:
            'TOEIC700 / Speaking130 / OPIC IM3 / TOEFL(IBT)80 / NEWTEPS300 / JPT740 / JLPT N1 / 신HSK6급 / DELF B1 중 택1',
        },
        { type: 'COMPETITION', condition: '교외 공모전 입상(상세기준 추후공지, 학과심의 필요)' },
        {
          type: 'THESIS',
          condition:
            '필수: 지도교수 주제 승인 필요. 문화콘텐츠계열 졸업작품(3D애니메이션/모션그래픽/영상기획/영상시나리오/디자인포트폴리오 중 택1) 제출 가능',
        },
      ],
      trackRestrictionNote: '자격증 대체는 미디어공학트랙 전용 — 트랙미이수자는 이 옵션 없음',
      sourceUrl: 'https://mtc.catholic.ac.kr/mtc/course/academic.do',
    },
    {
      id: 3,
      departmentId: 345,
      trackId: 13,
      cohortLabel: '전체(공통)',
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 66, doubleMajorMin: 36 },
      comprehensiveExam: { hasExam: 'N', detail: '졸업종합시험 폐지됨(어학성적만 제출)' },
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition:
            'TOEIC700 / Speaking130 / OPIC IM3 / TOEFL(IBT)80 / NEWTEPS300 / JPT740 / JLPT N1 / 신HSK6급 / DELF B1 중 택1',
        },
        { type: 'COMPETITION', condition: '교외 공모전 입상(상세기준 추후공지, 학과심의 필요)' },
        {
          type: 'THESIS',
          condition: '필수: 지도교수 주제 승인. 졸업작품: 3D애니메이션/모션그래픽/영상기획/영상작품시나리오/디자인포트폴리오 중 택1',
        },
      ],
      trackRestrictionNote: '자격증 대체는 미디어공학트랙만 해당 — 문화콘텐츠트랙은 불가',
      sourceUrl: 'https://mtc.catholic.ac.kr/mtc/course/academic.do',
      notes: '트랙별 세부 인정과목은 roadmap.do 별도 확인 필요',
    },
    {
      id: 4,
      departmentId: 345,
      trackId: 14,
      cohortLabel: '전체(공통)',
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 66, doubleMajorMin: 36 },
      comprehensiveExam: { hasExam: 'N', detail: '졸업종합시험 폐지됨(어학성적만 제출)' },
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition:
            'TOEIC700 / Speaking130 / OPIC IM3 / TOEFL(IBT)80 / NEWTEPS300 / JPT740 / JLPT N1 / 신HSK6급 / DELF B1 중 택1',
        },
        { type: 'CERTIFICATE', condition: '정보처리기사, Oracle OCP/OCM 자격증 → 미디어공학트랙만 인정' },
        { type: 'COMPETITION', condition: '교외 공모전 입상(상세기준 추후공지, 학과심의 필요)' },
        {
          type: 'THESIS',
          condition:
            '필수: 지도교수 주제 승인. 개별작성 원칙이나 미디어공학 주제는 팀작성 가능(협의필요). 졸업작품: 응용소프트웨어작품개발',
        },
      ],
      trackRestrictionNote: '미디어공학트랙만 자격증 대체 옵션 보유(타 트랙 대비 유일한 차등점)',
      sourceUrl: 'https://mtc.catholic.ac.kr/mtc/course/academic.do',
      notes: '트랙별 세부 인정과목은 roadmap.do 별도 확인 필요',
    },
    {
      id: 5,
      departmentId: 345,
      trackId: 15,
      cohortLabel: '전체(공통)',
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 66, doubleMajorMin: 36 },
      comprehensiveExam: { hasExam: 'N', detail: '졸업종합시험 폐지됨(어학성적만 제출)' },
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition:
            'TOEIC700 / Speaking130 / OPIC IM3 / TOEFL(IBT)80 / NEWTEPS300 / JPT740 / JLPT N1 / 신HSK6급 / DELF B1 중 택1',
        },
        { type: 'COMPETITION', condition: '교외 공모전 입상(상세기준 추후공지, 학과심의 필요)' },
        {
          type: 'THESIS',
          condition: '필수: 지도교수 주제 승인. 졸업작품 옵션은 문화콘텐츠 계열과 동일 범주로 추정(원문에 명시적 구분 없음)',
        },
      ],
      trackRestrictionNote: '자격증 대체는 미디어공학트랙만 해당',
      sourceUrl: 'https://mtc.catholic.ac.kr/mtc/course/academic.do',
      notes: '테크니컬아티스트트랙 전용 졸업작품 옵션이 원문에 별도로 명시되지 않음 — 학과사무실 확인 권장. 트랙별 세부 인정과목은 roadmap.do 별도 확인 필요',
    },
    // ── 공간디자인·소비자학과 (기존 데이터 유지, id 재부여) ──
    {
      id: 6,
      departmentId: 322,
      cohortLabel: '전체(공통)',
      admissionYearFrom: 2018,
      creditBreakdown: { majorDeepMin: 69, doubleMajorMin: 36 },
      comprehensiveExam: {
        examSubjects: ['주거학', '실내디자인론', '소비자트렌드', '소비자학개론', '공간브랜딩'],
        majorRequiredCount: 3,
        doubleMajorRequiredCount: 3,
        passingRule: '선택한 3과목 모두 60점 이상',
        detail:
          '[주거학·실내디자인론·소비자트렌드·소비자학개론·공간브랜딩] 5과목 중 3과목 선택, 3과목 모두 60점 이상(1차 A/재시험 2차 B/재시험 3차 C)',
      },
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition: 'TOEIC750+ 등 12종 시험 기준 충족 시 종합시험 1과목 면제(동일 어학계열은 최대 2과목까지 면제 가능)',
          waives: 1,
        },
        {
          type: 'CERTIFICATE',
          condition: '전공 관련 기능사급/2급 이상 자격증(실내건축기사, 소비자전문상담사, GTQ, SQLD 등)',
          waives: 1,
        },
        {
          type: 'COMPETITION',
          condition: '전국규모 공모전 장려상 이상 / 교내 우수상 이상 / 학과 우수상 이상',
          waives: 1,
        },
        { type: 'OTHER', condition: '학과회의 개별심사 통과 시 기타 요건도 인정 가능' },
      ],
      thesisOptional: true,
      trackRestrictionNote: '없음(트랙 구분 없음, 전 학생 동일 기준)',
      sourceUrl: 'https://design.catholic.ac.kr/design/course/academic.do',
      notes: '졸업최저이수학점 총량이 명시적 숫자로 안 나옴(130학점 학교 공통기준으로 추정) — 학과사무실 확인 필요. 졸업논문 옵션 원문에 명시 없음(종합시험 대체 항목에 미포함)',
    },
    // ── 경영학과 (내국인/외국인, 패턴 ②) ──
    {
      id: 7,
      departmentId: 102,
      cohortLabel: '2007학번~ (내국인)',
      admissionYearFrom: 2018,
      comprehensiveExam: {
        hasExam: 'N(Pass/Fail 방식, 응시선택 시에만 시험형태)',
        detail: '선택3(대회입상)에 한해 졸업시험 응시 가능 옵션 있음 — 그 외엔 시험 자체가 없음',
      },
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition:
            'TOEIC700+ / TOEFL(IBT)82+ / NEWTEPS268+ / JPT700+ / JLPT N2+ / HSK5급+ / IELTS6.0+ / TOEIC Speaking IM1+ / OPIC IM(2~) / GEO영어과목 B0이상 / 기타 스페인어(DELE B2)·프랑스어(DELF B1) 등',
        },
        { type: 'COMPETITION', condition: '경영학전공 주최 학술행사 수상(1~3위) — 교내창업경진대회/교외입상은 불인정, 상장사본 제출 필수' },
        { type: 'THESIS', condition: '선택1: 논문연구계획서 제출·지도교수 승인 후 논문 제출·평가통과' },
        { type: 'OTHER', condition: '선택1(논문)/선택2(어학)/선택3(대회입상) 중 택1, PASS/FAIL 방식' },
      ],
      thesisOptional: true,
      trackRestrictionNote: '없음',
      sourceUrl: 'https://business.catholic.ac.kr/business/course/academic.do',
      notes: '졸업최저이수학점은 학번별 상이(학과사무실 확인 필요). 자격증 대체 옵션 없음(2006학번 이전과 다름)',
    },
    {
      id: 8,
      departmentId: 102,
      cohortLabel: '2007학번~ (외국인)',
      admissionYearFrom: 2018,
      comprehensiveExam: {
        hasExam: 'Y(선택3 응시 시)',
        detail:
          '필수: 한국어능력시험4급 이상 + 선택(어학/대회입상/졸업시험) 중 택1. 졸업시험 선택 시 마케팅·생산경영·인적자원관리·재무관리·MIS·국제경영론·경영전략론 7과목 중 2과목 응시, 과목당 100점만점 60점 이상 합격. 학점 B0이상이면 해당과목 시험 면제',
      },
      mandatoryRequirements: [
        { type: 'LANGUAGE', condition: '한국어능력시험 4급 이상', note: '외국인 학번군 전원 필수 — 이후 선택(어학/대회입상/졸업시험) 중 택1과 조합' },
      ],
      substitutionRules: [
        { type: 'LANGUAGE', condition: '내국인과 동일 기준(모국어가 영어면 제2외국어 성적 인정)' },
        { type: 'COMPETITION', condition: '내국인과 동일(경영학전공 주최 학술행사 수상)' },
      ],
      thesisOptional: true,
      trackRestrictionNote: '없음',
      sourceUrl: 'https://business.catholic.ac.kr/business/course/academic.do',
      notes: '필수(한국어능력시험)+선택(어학/대회입상/졸업시험) 조합형 — 내국인과 요건 체계 자체가 다름. 자격증 대체 옵션 해당없음',
    },
    // ── 의생명과학과 (학번형, 패턴 ②⑤) ──
    {
      id: 9,
      departmentId: 343,
      cohortLabel: '20학번~ (2020학번 포함 이후)',
      admissionYearFrom: 2020,
      totalCreditMin: 130,
      creditBreakdown: { doubleMajorMin: 42, majorDeepMin: 72 },
      comprehensiveExam: { hasExam: 'N', detail: '졸업시험 없음' },
      mandatoryRequirements: [
        {
          type: 'THESIS',
          condition: '졸업논문 + 어학성적 + 3·4학년 기간 상담 4회 이상 — 3가지 요건 모두 충족 필요(대체 옵션 아니라 필수 병렬조건)',
        },
        {
          type: 'LANGUAGE',
          condition:
            'TOEIC600+ 상응(TEPS485+/TOEFL69+/TOEIC Speaking110+/TEPS Speaking42+/OPIC IM1+/NEWTEPS260+), 유효기간은 성적표 유효기간 기준',
        },
        { type: 'COUNSELING', condition: '3·4학년 기간 상담 4회 이상. 제2전공자는 별도 공지 확인 필요' },
      ],
      substitutionRules: [],
      trackRestrictionNote: '없음(트랙 없음, 학번군만 차등)',
      sourceUrl: 'https://mbs.catholic.ac.kr/mbs/course/academic.do',
      notes: "'졸업요건' 표 안에 원본 사이트 자체에 깨진 텍스트(테스트성 문자열)가 섞여 있었음 — 원문 재확인 권장",
    },
    {
      id: 10,
      departmentId: 343,
      cohortLabel: '18~19학번',
      admissionYearFrom: 2018,
      admissionYearTo: 2019,
      totalCreditMin: 130,
      creditBreakdown: { doubleMajorMin: 42, majorDeepMin: 72 },
      comprehensiveExam: { hasExam: 'N', detail: '졸업시험 없음' },
      mandatoryRequirements: [
        {
          type: 'ATTENDANCE',
          condition: '채집(학과행사 참여) 2회 이상 — 논문/어학 경로와 별개로 충족 필요. 특강·학술제 등 참여로 1:1 대체 가능',
          note: '채집 대상은 제1전공자·전공심화자(편입생·전과생 포함), 제2전공자는 미해당',
        },
      ],
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition: 'TOEIC850+ 또는 TEPS700+(NEWTEPS386+) — 반드시 구술면접(일반생물학 기준)과 결합해야 인정',
        },
        { type: 'THESIS', condition: '선택1: 졸업논문 단독으로 요건 충족 가능' },
      ],
      trackRestrictionNote: '없음(트랙 없음, 학번군만 차등)',
      sourceUrl: 'https://mbs.catholic.ac.kr/mbs/course/academic.do',
      notes:
        '원문은 19학번 이전 전체를 한 구간으로 묶고 있으나 18학번 미만은 방침에 따라 수록 제외함. 구술면접의 구체적 평가기준(합격점수 등)은 원문에 미기재',
    },
    // ── 국어국문학과 (병렬조건형, 패턴 ⑤⑦) ──
    {
      id: 11,
      departmentId: 300,
      cohortLabel: '전체(공통)',
      creditBreakdown: { majorDeepMin: 66, doubleMajorMin: 36 },
      comprehensiveExam: { hasExam: 'N', detail: '졸업시험 없음. 아래 요건 1항+2항 모두 충족 필요(병렬조건, 대체관계 아님)' },
      mandatoryRequirements: [
        {
          type: 'FIELD_TRIP',
          condition: '학술답사 1회 이상 참가(외국인 유학생·제2전공생은 면제)',
          note: '1항(논문/자격증/대회/학술행사 중 택1) 충족과 별개로 반드시 추가 충족해야 함 — 대체 옵션 아님',
        },
      ],
      substitutionRules: [
        {
          type: 'CERTIFICATE',
          condition:
            '국어능력인증시험(TOKL)/KBS한국어능력시험/한자능력자격시험(한국한자능력검정회·한국한자실력평가원 한정)/독서어드바이저 자격증 등 2급 이상 — 4개 중 택1',
        },
        { type: 'COMPETITION', condition: '교내·교외 각종 문학상 공모 입상' },
        {
          type: 'THESIS',
          condition:
            '국어국문학 3영역(한국어학/한국고전문학/한국현대문학) 관련 학술적 논의를 담은 논문 제출(2월졸업 10/31까지, 8월졸업 4/30까지)',
        },
        { type: 'OTHER', condition: '전공학술행사(학술제/응용작품대회/학과혁신경진대회) 참가 후 일정 수준 이상 평가' },
      ],
      trackRestrictionNote: '없음(트랙 없음)',
      sourceUrl: 'https://korean.catholic.ac.kr/korean/course/academic-information.do',
      notes:
        '이 학과는 URL 슬러그가 academic.do가 아니라 academic-information.do임(패턴 ⑦, 크롤러 슬러그 하드코딩 주의). 총 졸업학점은 학교 공통 130 추정(원문 미기재)',
    },
    // ── 심리학과 (무대체형, 패턴 ⑥⑧) ──
    {
      id: 12,
      departmentId: 308,
      cohortLabel: '18~21학번',
      admissionYearFrom: 2018,
      admissionYearTo: 2021,
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 66, doubleMajorMin: 36 },
      comprehensiveExam: {
        hasExam: 'Y',
        detail:
          '감각및지각·성격심리학·발달심리학·상담심리학·이상심리학·산업및조직심리학 6과목 중 3과목 선택, 3과목 평균 40점 미만이면 졸업불가(F). 재시험 없음',
      },
      mandatoryRequirements: [],
      substitutionRules: [],
      trackRestrictionNote: '이 학과는 시험을 대체할 수 있는 방법 자체가 없음 — 순수 시험 성적만으로 판정(대체_* 전부 해당없음)',
      sourceUrl: 'https://psychology.catholic.ac.kr/psychology/course/academic.do',
      notes:
        '등급 A~D는 졸업 가능, F(3과목 평균 40점 미만 또는 한 과목이라도 40점 미만 과락)면 졸업불가, 재시험 제도 자체가 없음. 원문은 98학번부터 존재하나 18학번 미만은 방침에 따라 수록 제외',
    },
    {
      id: 13,
      departmentId: 308,
      cohortLabel: '22학번~',
      admissionYearFrom: 2022,
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 66, majorDeepMin26: 60, doubleMajorMin: 36 },
      comprehensiveExam: {
        hasExam: 'Y',
        detail:
          '발달심리학·성격심리학·상담심리학·산업및조직심리학·이상심리학·인지심리학·사회심리학 7과목 중 3과목 선택, 3과목 평균 40점 미만이면 졸업불가(F). 재시험 없음. 22학번부터 시험과목 7개로 확대(인지심리학·사회심리학 추가, 감각및지각 제외)',
      },
      mandatoryRequirements: [
        {
          type: 'FOREIGN_LANGUAGE_COURSE',
          condition: '22학번부터 외국어 강의 필수 이수(6학점) — 졸업시험과는 무관하게 병렬로 존재',
        },
      ],
      substitutionRules: [],
      trackRestrictionNote: '이 학과는 시험을 대체할 수 있는 방법 자체가 없음',
      sourceUrl: 'https://psychology.catholic.ac.kr/psychology/course/academic.do',
      notes:
        '24~25학번은 교양선택 10학점 신설, 26학번은 전공선택 심화 60/복수전공 36으로 변경. 외국어강의 6학점 요건은 별도 병렬요건으로 향후 컬럼 확장 필요',
    },
    // ── 인공지능학과 (필수+선택 혼합형, 패턴 ⑪) ──
    {
      id: 14,
      departmentId: 347,
      cohortLabel: '2024학번 기준(원문 명시)',
      admissionYearFrom: 2024,
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 66, majorSelect: 45 },
      comprehensiveExam: { hasExam: 'N', detail: '졸업시험 없음' },
      mandatoryRequirements: [
        {
          type: 'LANGUAGE',
          condition: 'TOEIC700+ / NEWTEPS300+ / TOEFL(IBT)80+ / TOEIC Speaking130+ / OPIC IM2+ 중 택1',
          note: '대체옵션이 아니라 전원 필수요건(mbs와 유사한 병렬조건형) — 아래 택1 항목과 별개로 항상 충족해야 함',
        },
      ],
      substitutionRules: [
        {
          type: 'THESIS',
          condition:
            '졸업논문(지도교수 최종승인 필요) / 인턴십(인공지능학현장실습Ⅰ~Ⅴ, 장기 산업체현장실습) / 졸업작품(캡스톤디자인1·2 수강 후 전시회 입선 이상) 중 택1',
          note: '졸업작품 옵션은 캡스톤디자인 교과목 수강이 선행 필요',
        },
      ],
      trackRestrictionNote:
        '없음(공식 트랙은 없으나, 전공선택 36학점 이수 시 컴퓨터정보공학부·수학과·경영학과 등과 복수전공 인정되는 "융합전공" 경로가 별도로 존재 — 정식 트랙명은 아님)',
      sourceUrl: 'https://ai.catholic.ac.kr/ai/course/academic.do',
      notes: "페이지가 '2024학번 기준'이라고 명시되어 있어 18~23학번 데이터는 별도 확인 필요. 21,22학번은 전공필수 0·전공선택 36(66)",
    },
    // ── 화학과 (부분대체형, 패턴 ⑨) ──
    {
      id: 15,
      departmentId: 318,
      cohortLabel: '20학번 (원문에 이 학번만 명시됨, 18~19학번은 별도 확인 필요)',
      admissionYearFrom: 2020,
      totalCreditMin: 130,
      creditBreakdown: { firstMajor: 51, doubleMajor: 24 },
      comprehensiveExam: {
        hasExam: 'Y(논문과 택1)',
        detail:
          '필수 2과목(물리화학, 유기화학) + 선택 1과목(무기화학/분석화학/생화학 중 택1), 총 3과목. 등급 A/B/C 합격, F 불합격. 과목당 70점 미만 과락',
      },
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition: '졸업시험 응시자 한정: 신청기간 내 영어성적 제출 시 점수 구간에 따라 시험 과목이 부분 면제됨',
          scope: 'PARTIAL',
          note: '전체 대체 아님(부분 면제), 정확한 등급별 점수구간은 원문에 상세 미기재',
        },
        {
          type: 'THESIS',
          condition: '졸업논문 제출 — 시험과 완전히 동등한 대체 경로(택1). 3학년 2학기 기말고사 1~2주 전 신청, 4학년 2학기 제출',
        },
      ],
      trackRestrictionNote: '졸업시험과 졸업논문은 서로 배타적 택1 관계(대체 옵션이 아니라 두 개의 독립 경로). 없음(트랙 없음)',
      sourceUrl: 'https://chemistry.catholic.ac.kr/chemistry/course/academic.do',
      notes:
        '이 페이지는 2020학번 전용으로 명시됨 — 18~19학번은 학사제도 안내책자에서 별도 확인 필요. 영어성적에 따른 과목 면제의 정확한 점수구간은 매 학기 공지사항(졸업종합시험 안내)에서 갱신되므로 academic.do만으론 불완전(패턴 ⑨)',
    },
    // ── 사회복지학과 (페이지 미기재형, 패턴 ⑩) ──
    {
      id: 16,
      departmentId: 307,
      cohortLabel: '18~19학번',
      admissionYearFrom: 2018,
      admissionYearTo: 2019,
      totalCreditMin: 130,
      creditBreakdown: { majorSelect: 30, majorSelectAlt: 60 },
      comprehensiveExam: {
        detail: '학과 공식 학사정보 페이지(course/academic.do)에는 이수학점표만 있고 졸업시험/졸업논문/대체인정 정보 자체가 없음',
      },
      dataSource: 'NOT_FOUND',
      substitutionRules: [],
      trackRestrictionNote: '없음(트랙 없음)',
      sourceUrl: 'https://socialwelfare.catholic.ac.kr/socialwelfare/course/academic.do',
      notes:
        '전학년 평점평균 2.00 이상 별도 요건. 사회복지사 2급 자격증이 교과과정 이수와 연계되어 있어 졸업요건이 시험이 아니라 자격증 실습 요건 쪽에 있을 가능성 높음 — 학과 공지사항 게시판에서 "졸업요건 제출 안내" 유형 게시물 확인 필요(크롤러 폴백 대상 사례)',
    },
    // ── 데이터사이언스학과 ──
    {
      id: 17,
      departmentId: 205,
      cohortLabel: '전체(공통, ~2024학번은 전공선택 36학점 기준)',
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 66, doubleMajorMin: 36 },
      comprehensiveExam: { hasExam: 'N', detail: '졸업시험 없음' },
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition: '어학성적이 필수요건으로 언급되나 구체 점수기준은 원문에서 직접 확인 못함(ai학과와 동일 체계로 추정, 별도 검증 필요)',
        },
        { type: 'THESIS', condition: '졸업논문(공식 학회발표논문 또는 지도교수 지도 학사학위논문, 학과 검토 후 인정) / 인턴십 / 졸업작품 중 택1' },
      ],
      trackRestrictionNote: '없음(트랙 없음)',
      sourceUrl: 'https://datascience.catholic.ac.kr/datascience/course/academic.do',
      notes: 'AI전자정보융합대학 소속 학과들(인공지능학과·데이터사이언스학과)이 어학성적 필수+논문/인턴십/졸업작품 택1 구조를 공유하는 것으로 보이나, 어학성적 구체 기준표는 별도 확인 필요 — 어학성적을 mandatoryRequirements가 아닌 substitutionRules에 둔 이유는 필수 여부 자체가 미확인이라서다',
    },
    // ── 정보통신전자공학부 (졸업시점 기준 정책변경형, 패턴 ⑫) ──
    {
      id: 18,
      departmentId: 346,
      cohortLabel: '2025년 8월 졸업 이전 (2007학번부터 적용되던 구제도)',
      admissionYearFrom: 2007,
      comprehensiveExam: {
        hasExam: 'Y',
        detail:
          '2007학번부터: 전공일반 4과목 중 2과목 + 전공심화 6과목 중 2과목 선택(복수전공자는 각 5과목 중 2과목). 과목: 정보통신공학(통신이론·컴퓨터네트워킹·디지털신호처리·컴퓨터구조·논리회로및실험) / 반도체시스템공학(회로이론·신호및시스템·논리회로및실험·컴퓨터구조·반도체프로세스)',
      },
      substitutionRules: [{ type: 'LANGUAGE', condition: '어학성적 병행 인정 제도가 있었음(구체 기준 미확인)' }],
      trackRestrictionNote: '정보통신공학 vs 반도체시스템공학 트랙별로 시험과목 세트가 다름(복수전공 시 각 5과목 중 2과목)',
      sourceUrl: 'https://ice.catholic.ac.kr/ice/course/academic.do',
      notes:
        '종합시험·어학성적 제도는 2025년 8월 졸업자까지만 적용되고 이후 폐지됨(아래 신제도 행 참고). 외국어 강의 이수요건은 별도 존재(2022학번 9학점, 2023학번부터 12학점)',
    },
    {
      id: 19,
      departmentId: 346,
      cohortLabel: '2025년 8월 졸업 이후 (신제도, 학번 무관하게 해당 시점 이후 졸업자 전원 적용)',
      basis: 'GRADUATION_DATE',
      graduationDateFrom: '2025-08',
      comprehensiveExam: { hasExam: 'N', detail: '졸업시험 폐지됨. 대신 서류제출 기반 심사로 전환' },
      mandatoryRequirements: [
        {
          type: 'CAPSTONE_REPORT',
          condition: '종합설계보고서(캡스톤디자인 또는 종합설계 과목 결과보고서에 본인 기여분 1~2p 요약 첨부)',
          note: '자격증/대회입상/논문 중 하나와 함께 제출하는 것으로 보임 — 정확한 조합관계는 공지문 원문 재확인 필요',
        },
      ],
      substitutionRules: [
        {
          type: 'CERTIFICATE',
          condition: '전공 관련 자격증(전기·전자·통신·네트워크·정보처리 등, 워드프로세서/컴퓨터활용능력 등 일반 자격증은 제외) 상장/증빙 제출',
        },
        { type: 'COMPETITION', condition: '전공 관련 대회 입상(포스터·대회 홈페이지 링크 등 증빙 자료 제출, 학과 승인 필요)' },
        { type: 'THESIS', condition: '졸업논문(지도교수 지도)' },
      ],
      trackRestrictionNote: '정보통신공학/반도체시스템공학 구분이 신제도에서도 유지되는지 불명확 — 확인 필요',
      sourceUrl: 'https://ice.catholic.ac.kr/ice/community/notice.do?mode=view&articleNo=259396',
      notes:
        '★중요 패턴: 졸업시점 기준으로 제도가 통째로 바뀜(입학년도 기준 아님) — 오래된 학번이라도 2025년 8월 이후 졸업하면 신제도 적용. 학사정보 페이지(course/academic.do)는 구제도만 기술하고 있어 신제도 정보는 공지사항에서만 확인 가능(패턴 ⑩+⑫ 동시 사례)',
    },
    // ── 사회학과 ──
    {
      id: 20,
      departmentId: 309,
      cohortLabel: '05학번~ (전공필수과목 기준. 04학번 이전은 과사무실 문의 필요)',
      admissionYearFrom: 2005,
      totalCreditMin: 130,
      comprehensiveExam: { hasExam: 'N', detail: '졸업시험 없음' },
      mandatoryRequirements: [
        {
          type: 'FIELD_TRIP',
          condition:
            '현장학습(학과 필수행사) 참여가 졸업논문 제출 자격의 전제조건: 10학번 이후 2회 이상(09학번 1회, 08학번 이전 미적용, 편입생 1회, 제2전공자는 선택)',
          note: '대체과제(학과행사 3회 참여 등)로 1회까지 대체 가능(2017.1.1부터 시행)',
        },
      ],
      substitutionRules: [
        {
          type: 'THESIS',
          condition:
            '졸업논문 제출(성적 D 이상이면 졸업 가능) 또는 다큐멘터리 등 기타 영상물 제작 중 택1. 6학기 논문제목 신청 → 7학기 제목변경신청+사회학실습 수강 → 8학기 제출마감(가을졸업 4/30, 겨울졸업 10/31)',
        },
      ],
      trackRestrictionNote: '없음(트랙 없음)',
      sourceUrl: 'https://sociology.catholic.ac.kr/sociology/course/academic.do',
      notes: '원문에 구체 학점표 없음, 학사제도 안내책자 참고 필요',
    },
    // ── 철학과 ──
    {
      id: 21,
      departmentId: 301,
      cohortLabel: '전체(공통)',
      totalCreditMin: 130,
      comprehensiveExam: {
        hasExam: 'Y(논문과 택1)',
        detail: '졸업시험 응시 시: 홈페이지 게시 문제 20문항 중 출제, 매년 5월·11월 시행, 재시험도 동일 일정으로 운영',
      },
      mandatoryRequirements: [
        {
          type: 'FOREIGN_LANGUAGE_COURSE',
          condition: '2022학번부터 외국어강의 의무이수(중핵교양 글로벌·영어 영역 또는 전공교과목 중 외국어강의)',
          note: '졸업논문/시험과는 독립적인 병렬요건',
        },
      ],
      substitutionRules: [
        { type: 'THESIS', condition: '졸업논문 제출(자유주제, 지도교수 상담 후 결정) — 졸업시험과 완전 동등한 택1 경로' },
      ],
      trackRestrictionNote: '졸업논문/졸업시험 둘 다 불통과 시 졸업 불가, 수료로 처리됨. 졸업 학기에 반드시 재신청 필요(졸업 유예 시 재신청). 없음(트랙 없음)',
      sourceUrl: 'https://philosophy.catholic.ac.kr/philosophy/course/academic.do',
    },
    // ── 에너지환경공학과 ──
    {
      id: 22,
      departmentId: 321,
      cohortLabel: '전체(공통)',
      creditBreakdown: { majorDeepMin: 66, doubleMajorMin: 36 },
      comprehensiveExam: {
        hasExam: 'Y(논문과 택1)',
        detail: '졸업종합시험 응시 또는 졸업논문 제출 중 택1(상세 과목·기준은 원문 스니펫에 미포함, 원본 페이지 재확인 필요)',
      },
      substitutionRules: [{ type: 'THESIS', condition: '졸업논문 제출 — 시험과 택1 관계' }],
      trackRestrictionNote: '없음(트랙 없음)',
      sourceUrl: 'https://envi.catholic.ac.kr/envi/course/academic.do',
      notes: '검색 스니펫만 확보된 상태 — 시험 과목 구성, 논문 절차 등 세부사항은 원본 페이지 전체를 다시 열어 확인 필요(파일럿 수준 정보로만 기재)',
    },
    // ── 법학과 ──
    {
      id: 23,
      departmentId: 313,
      cohortLabel: '전체(공통, 세부 학번 구간은 미확인)',
      comprehensiveExam: {
        hasExam: 'Y',
        detail:
          '1차 시험 응시 → 불통과 시 2차(재시험) 응시 → 2차도 불통과 시 졸업요건 미충족. 매학기 5월·11월경 시행(2026-1학기 사례: 1차 5/7, 2차 5/28)',
      },
      substitutionRules: [],
      trackRestrictionNote: '없음(트랙 없음)',
      sourceUrl: 'https://law.catholic.ac.kr/law/course/academic.do',
      notes:
        '공지사항 게시물 기반, academic.do 원문 미대조 — 대체인정(자격증·어학 등) 존재 여부가 불명확하므로 심리학과식 무대체형으로 단정하지 말 것, 반드시 원본 페이지 확인 후 갱신 필요',
    },
    // ── 경제학과 (점수누적형, 패턴 ⑬) ──
    {
      id: 24,
      departmentId: 314,
      cohortLabel: '전체(공통, 영어강의 이수학점만 학번별 차등)',
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 72, doubleMajorMin: 36 },
      scoringMethod: 'POINT_ACCUMULATION',
      pointThreshold: 100,
      comprehensiveExam: { hasExam: 'N', detail: '졸업시험 없음' },
      mandatoryRequirements: [
        {
          type: 'FOREIGN_LANGUAGE_COURSE',
          condition: '경제학과 개설 영어강의 이수(2014~2021학번 1과목/3학점, 2022학번~ 5과목/15학점)',
          note: '2022학번 이후 신설된 학교 공통 외국어강의 졸업요건과는 별개이며 중복인정 가능',
        },
      ],
      substitutionRules: [],
      trackRestrictionNote: '없음(트랙 없음)',
      sourceUrl: 'https://economics.catholic.ac.kr/economics/course/academic.do',
      notes:
        '★신규 패턴: 단일 시험/논문 대신 졸업성적 100점 총점제 운영(점수누적형). 정확한 배점표는 웹페이지 첨부파일로만 제공되어 이번 조사에서 파일 내용 미확인 — 크롤러가 첨부파일까지 파싱해야 완전한 데이터가 됨. 평점평균 2.0 이상 별도요건',
    },
    // ── 영어영문학부 (점수누적형+전공자 유형별 완화, 패턴 ⑬⑭) ──
    {
      id: 25,
      departmentId: 303,
      cohortLabel: '2020학번~',
      admissionYearFrom: 2020,
      comprehensiveExam: { hasExam: 'N', detail: '졸업시험 없음' },
      substitutionRules: [
        { type: 'LANGUAGE', condition: '어학성적: TOEIC850+ A, 1~6차학기 제출' },
        { type: 'OTHER', condition: '학술제(팀 공연, 심사 후 A/B)' },
        { type: 'OTHER', condition: '졸업영어발표(단독/팀, 심사 후 A/B)' },
        { type: 'THESIS', condition: '학술논문(5차학기 이상 신청자격)' },
        { type: 'OTHER', condition: '소모임(한 학기 이상 참여+성과물)' },
      ],
      trackRestrictionNote: '없음(트랙 없음). 5가지 중 택1이지만 항목별로 평가체계(P/F, A/B 등급 등)가 다름',
      sourceUrl: 'https://english.catholic.ac.kr/english/course/academic.do',
    },
    {
      id: 26,
      departmentId: 303,
      cohortLabel: '2014~2019학번',
      admissionYearFrom: 2014,
      admissionYearTo: 2019,
      scoringMethod: 'POINT_ACCUMULATION',
      pointThreshold: 100,
      comprehensiveExam: { hasExam: 'N', detail: '졸업시험 없음' },
      scoreItems: [
        {
          label: '공인영어성적(TOEIC 또는 학부장 협의 시 TOEFL/TEPS/IELTS)',
          weightPercent: 70,
          note: '850+는 70점/800+는 60점/750+는 50점. TOEIC900+ 제출 시 Workshop 면제 및 만점(30점) 부여',
        },
        { label: 'Junior English Workshop(3학년 원칙)', weightPercent: 30 },
        { label: '학술답사', note: '1회 이상, 레포트·영상으로 대체 가능(배점 미명시, Workshop 항목에 포함되는 것으로 추정)' },
      ],
      mandatoryRequirements: [
        {
          type: 'RELIEF_DOUBLE_MAJOR',
          condition: '2전공자는 어학성적만 충족하면 졸업 가능(1전공자보다 완화된 기준)',
          note: '5개 학과 중 최초로 발견된 2전공자 완화 규정(패턴 ⑭)',
        },
      ],
      substitutionRules: [],
      trackRestrictionNote: '없음(트랙 없음)',
      sourceUrl: 'https://english.catholic.ac.kr/english/course/academic.do',
      notes: '2014년 이전 입학생은 학과 별도 문의 필요(원문에 명시). economics학과와 유사한 점수누적형',
    },
    // ── 국사학과 ──
    {
      id: 27,
      departmentId: 302,
      cohortLabel: '전체(공통, 답사 횟수 요건은 2022년 2월 졸업예정자부터 3회→2회로 변경)',
      creditBreakdown: { majorDeepMin: 66, majorRequired: '3~6', majorSelect: '60~63' },
      comprehensiveExam: { hasExam: 'N', detail: '졸업시험 없음' },
      mandatoryRequirements: [
        {
          type: 'FIELD_TRIP',
          condition: '답사(춘계 2박3일+추계 1박2일) 2회 이상 참여가 졸업논문과 별개의 병렬 필수조건 — 미참여 시 졸업 불가',
          note: '질환 등 불가피한 사유는 개인답사보고서로 대체 가능. 국사학 제2전공자는 답사 요건 면제',
        },
      ],
      substitutionRules: [
        { type: 'COMPETITION', condition: '국사학과 주최 역사문화 콘텐츠 공모전 우수 성적 입상(2023.02.27 신설)' },
        {
          type: 'THESIS',
          condition: '졸업논문 제출이 기본. 대체요건(학과 심사 후 인정): 학술고적답사 탐구결과 보고서 등',
        },
      ],
      trackRestrictionNote: '없음(트랙 없음)',
      sourceUrl: 'https://koreanhistory.catholic.ac.kr (정확한 course/academic.do 경로 미확인, 공지사항 기반)',
      notes:
        '공지사항 게시물 기반, academic.do 원문 미대조. 요건이 수시로 개정됨(2021.05, 2022.01, 2023.02, 2024.07, 2024.11) — 크롤러가 최신 공지를 기준으로 갱신하는 로직이 특히 중요한 사례',
    },
    // ── 행정학과 (점수누적형) ──
    {
      id: 28,
      departmentId: 315,
      cohortLabel: '2024년 8월 졸업~ (신제도)',
      scoringMethod: 'POINT_ACCUMULATION',
      pointThreshold: 100,
      comprehensiveExam: { hasExam: 'N', detail: '졸업시험 없음' },
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition: '외국어 성적(2016년 개정 시 HSK 6급→4급 완화, 유효기간 폐지→대학 입학 이후 취득분 인정으로 변경)',
        },
        { type: 'CERTIFICATE', condition: '자격증(취득시기 무관→대학 입학 이후 취득분 인정으로 변경)' },
        { type: 'COMPETITION', condition: '대회입상' },
      ],
      trackRestrictionNote: '[외국어+자격증+대회입상+교내외활동] 4개 항목 합산 100점 이상이면 졸업 — 경제학과·영어영문학부와 동일한 점수누적형. 없음(트랙 없음)',
      sourceUrl: 'https://pa.catholic.ac.kr (정확한 course/academic.do 경로 미확인, 공지사항 기반)',
      notes:
        '공지사항 게시물 기반, academic.do 원문 미대조. 2016년 세부기준 완화, 2024년 8월부터 100점 합산제로 전환 — 항목별 배점표는 미확인(논문 포함 여부도 미확인)',
    },
    // ── 수학과 (직접 열람 확인, 패턴 ⑮ 대체완료 사례) ──
    {
      id: 29,
      departmentId: 319,
      cohortLabel: '전체(공통, 졸업시험 제도는 2025년 2월 졸업대상자부터 적용)',
      admissionYearFrom: 2025,
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 66, majorDeepRequired: 12, doubleMajorMin: 36, doubleMajorRequired: 12, minorMin: 21 },
      comprehensiveExam: {
        requiredAreas: ['해석학개론', '선형대수학'],
        electiveAreas: ['대수학', '위상기하', '통계학', '금융수학', '계산수학', '인공지능'],
        majorRequiredCount: 4,
        doubleMajorRequiredCount: 3,
        passingRule: '전체 평균 60점 이상(75점 이상 A, 60~74점 B), 각 영역 40점 이상',
        detail:
          '전공심화는 4영역 이상(필수2+선택2이상), 복수전공은 3영역 이상(필수2+선택1이상) 응시. 7학기부터 학기당 1회 응시(직전 학기 평점 3.5+면 6학기부터 가능)',
      },
      substitutionRules: [
        { type: 'LANGUAGE', condition: 'TOEIC650+(NEWTEPS246+/iBT75+)', waives: 1, note: '선택영역 1개' },
        { type: 'LANGUAGE', condition: 'TOEIC750+(NEWTEPS287+/iBT85+)', waives: 2, note: '선택영역 1개+필수영역 1개' },
        { type: 'LANGUAGE', condition: 'TOEIC850+(NEWTEPS338+/iBT99+)', waives: 3, note: '선택영역 1개+필수영역 2개(최근 3년 이내 성적)' },
        { type: 'CERTIFICATE', condition: '펀드투자권유대행인 또는 증권투자권유대행인 중 1개 취득', waives: 1, note: '금융수학영역만 대체' },
        { type: 'COMPETITION', condition: '학술제 수상 시 수상내역에 따라 선택영역 중 1개 대체', waives: 1 },
      ],
      trackRestrictionNote:
        '없음(트랙 없음). 수학과 교직과정은 2022년 입학자부터 폐지됨. 영어성적/자격증 대체자도 반드시 응시원서는 제출해야 함',
      sourceUrl: 'https://math.catholic.ac.kr/math/course/academic.do',
      notes: '이 학과는 실제 페이지 직접 열람으로 확인한 데이터임(Claude Code 세션 403 차단 상태에서 정보없음으로 남겼던 부분 — 대체 완료). 논문 옵션 없음(시험 단일경로)',
    },
    // ── 회계학과 ──
    {
      id: 30,
      departmentId: 332,
      cohortLabel: '전체(공통, 외국어강의 의무학점만 학번별 차등: 22학번 9학점/23~25학번 12학점)',
      comprehensiveExam: { hasExam: 'N', detail: '졸업시험 없음. 아래 6개 대안(Pathway) 중 1가지 충족' },
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition:
            '토익700+(또는 상응점수: TOSEL Advanced543/TOEFL CBT203·IBT74·PBT537/TEPS572/NEWTEPS268/IELTS5.0/TOEIC Speaking130/GEO Level4/OPIc IM2/G-TELP Level2 65+) + 재경관리사 자격증 함께 취득해야 인정(단독 대체 아님). 스페인어(DELE B2+)/프랑스어(DELF B1+)/일본어(JPT750+ 또는 JLPT2급+)/중국어(HSK5급+)도 토익 대체로 인정',
        },
        {
          type: 'CERTIFICATE',
          condition: '공인회계사·세무사·보험계리사·관세사1차·세무직(국가직)7급 합격 / 미국공인회계사(AICPA)·미국관리회계사(CMA) 합격',
        },
        { type: 'COMPETITION', condition: '회계학과 학술논문발표회 1~3등(팀3인이내) / 회계관련 외부공모전 입상(1~3등)' },
        {
          type: 'THESIS',
          condition: '졸업논문 제출 — 외국인학생/북한이탈주민/만학도 또는 평점평균3.0+이고 전공교수회의 승인받은 경우에 한해 제출 가능(일반 학생 기본 이용 불가)',
        },
      ],
      trackRestrictionNote:
        '없음(트랙 없음). 6개 대안 중 택1(자격증계열/AICPA·CMA/학술논문/공모전/토익+재경관리사/논문) — 공무원시험 합격·국가고시 합격·대학원진학·장교임관 등은 면제사유로 불인정',
      sourceUrl: 'https://accounting.catholic.ac.kr/accounting/course/academic.do',
      notes: '졸업최저이수학점 구체 수치는 이 페이지에 없음(경영대학 공통기준 참고 필요)',
    },
    // ── 물리학과 (학번형) ──
    {
      id: 31,
      departmentId: 320,
      cohortLabel: '~2025학년도 입학생',
      admissionYearTo: 2025,
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 66, majorDeepRequired: 13, doubleMajorMin: 36, doubleMajorRequired: 13 },
      comprehensiveExam: {
        hasExam: 'Y',
        detail:
          '전공심화자: 역학1·양자역학1·전자기학1·전공선택혼합(역학2/양자역학2/전자기학2/열및통계물리학1 내용 혼합) 4과목, 각 과목 60점+합격(외국인유학생 40점+). 복수전공자: 전공선택혼합 제외 3과목만 응시',
      },
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition: 'TOEIC700+/TOEIC Speaking6~8등급/TEPS297+(248회 이후 기준, 이전은 550+)/TOEFL iBT79+·CBT215+/OPIC IM+ 중 택1',
          scope: 'PARTIAL',
          note: '전공선택혼합 과목만 부분면제 가능',
        },
        {
          type: 'CERTIFICATE',
          condition:
            '전기(전기기능사~건축전기설비기술사)/전자(전자기능사~전자응용기술사)/통신(전파전자통신기능사~정보통신기술사)/항공(항공전기전자정비기능사~항공기관기술사) 계열 자격증. 그 외 자격증은 학과회의 개별심사',
          scope: 'PARTIAL',
          note: '전공선택혼합 과목만 부분면제',
        },
      ],
      trackRestrictionNote:
        '전공선택혼합 1과목만 부분대체 가능 — 나머지 필수 3과목(역학1/양자역학1/전자기학1)은 대체 불가. 없음(트랙 없음, 전공심화/복수전공 구분만 있음)',
      sourceUrl: 'https://physics.catholic.ac.kr/physics/course/academic.do',
      notes:
        "2026년 2월 졸업자부터 요건이 일부 완화된다는 공지 확인(articleNo=265413, 아래 2026학번 행 참고). 부전공자는 물리학과 전공과목 21학점 이상(역학1·양자역학1·전자기학1 포함) 이수. 논문 옵션 없음",
    },
    {
      id: 32,
      departmentId: 320,
      cohortLabel: '2026학년도 입학생~',
      admissionYearFrom: 2026,
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 60, majorDeepRequired: 13, doubleMajorMin: 36, doubleMajorRequired: 13 },
      comprehensiveExam: {
        hasExam: 'Y',
        detail:
          '2025학번 이전과 동일한 시험구조로 추정(역학1·양자역학1·전자기학1·전공선택혼합) — 요건 완화는 주로 이수학점(66→60)에 반영된 것으로 보이며, 시험 자체의 완화 여부는 재확인 필요',
      },
      substitutionRules: [
        { type: 'LANGUAGE', condition: '2025학번 이전과 동일 기준으로 추정(재확인 필요)', scope: 'PARTIAL' },
        { type: 'CERTIFICATE', condition: '2025학번 이전과 동일 기준으로 추정(재확인 필요)', scope: 'PARTIAL' },
      ],
      trackRestrictionNote: '전공선택혼합 1과목만 부분대체 가능으로 추정. 없음(트랙 없음)',
      sourceUrl: 'https://physics.catholic.ac.kr/physics/course/academic.do',
      notes:
        "'2026년 2월 졸업자부터 요건 일부 완화' 공지의 구체적 변경 범위(학점만인지 시험도 포함인지)를 원문 첨부파일에서 확인하지 못함 — 전공심화 66→60학점 변경만 명시적으로 확인됨",
    },
    // ── 의류학과 (창작물 단일형, 패턴 ⑯) ──
    {
      id: 33,
      departmentId: 323,
      cohortLabel: '2015학번~ (전공필수 과목명 기준. 2014학번 이전은 과목명이 다름)',
      admissionYearFrom: 2015,
      creditBreakdown: { majorDeep: 63, doubleMajor: 30 },
      comprehensiveExam: {
        hasExam: 'N',
        detail: '졸업시험/졸업논문 없음. 순수 창작물(졸업작품) 심사로만 판정',
      },
      mandatoryRequirements: [
        {
          type: 'CREATIVE_WORK',
          condition:
            '4학년 1학기 개설 2과목(졸업컬렉션캡스톤디자인, 패션쇼기획과연출) 중 택2 수강 → 3벌 이상 의상 제작 → 9~10월 졸업작품발표회 발표+포트폴리오 제출 → 두 작품 평균점수로 등급(90+A/80+B/70+C/60+D/60미만F)',
          note: '참여조건: 전공필수과목(2015학번부터 서양의복구성1·패션일러스트레이션1, 2025년부터 여성복제작실습1·패션일러스트레이션으로 과목명 변경) 이수+최소 6차 학기 이상 등록',
        },
      ],
      substitutionRules: [],
      trackRestrictionNote: '없음(트랙 없음). 대체_* 컬럼 전부 해당없음(어학/자격증/공모전/논문 요건 자체가 없음)',
      sourceUrl: 'https://clothing.catholic.ac.kr/clothing/course/academic.do',
      notes:
        '★신규 패턴: 시험도 논문도 아닌 졸업작품(패션쇼/컬렉션 제작) 단일 경로만 존재. 이수학점 연차별 표에서 필수/선택 합계 수치가 다른 학과 패턴과 안 맞아(129 근사치) 원문 표 서식 오류 가능성 — 정확한 총량은 학과사무실 확인 권장',
    },
    // ── 식품영양학과 (첨부파일 전용형, 패턴 ⑰) ──
    {
      id: 34,
      departmentId: 324,
      cohortLabel: '전체(공통, 2022.09.01 개정 기준)',
      comprehensiveExam: {
        hasExam: 'Y(논문과 택1)',
        detail:
          '졸업논문이나 졸업시험 둘 중 하나 선택하는 구조로 확인됨(2022-09-01 개정 공지 제목 기준) — 시험 과목·합격기준 등 세부사항은 원문 첨부파일(articleNo=115578)을 열람하지 못해 미확인',
      },
      dataSource: 'NOTICE_ATTACHMENT',
      substitutionRules: [{ type: 'THESIS', condition: '졸업논문 — 졸업시험과 택1 관계' }],
      trackRestrictionNote:
        '없음(트랙 없음). 영양사 국가시험 응시 관련 서류제출 요건이 졸업요건과 별도로 존재(4학년 대상, 매년 공지) — 영양사 면허 자체는 학위 졸업요건이 아니라 국가고시 응시자격 요건이므로 혼동 주의',
      sourceUrl: 'https://fn.catholic.ac.kr/fn/course/academic.do (첨부파일 미열람)',
      attachmentUrl: 'https://fn.catholic.ac.kr/fn/community/notice.do?mode=view&articleNo=115578',
      notes:
        '졸업논문/졸업시험 세부기준(과목, 합격점수 등)은 공지사항 첨부파일(PDF/HWP)에만 있고 본문에는 없음 — 첨부파일 다운로드 후 텍스트 추출 필요(크롤러 설계 시 첨부파일 파싱 기능이 필요한 대표 사례)',
    },
    // ── 음악과 (페이지 미기재형) ──
    {
      id: 35,
      departmentId: 329,
      cohortLabel: '전체(공통)',
      comprehensiveExam: {
        detail:
          '학사정보(course/academic.do) 페이지에는 세부전공 5개(피아노/작곡/오르간/성악/관현악) 구성과 1~2학년 공통과목(기초이론/화성학/시창/청음/음악사) 안내만 있고, 졸업시험/졸업연주/논문 등 졸업요건 자체는 이 페이지에 없음',
      },
      dataSource: 'NOT_FOUND',
      substitutionRules: [],
      trackRestrictionNote: '세부전공별로 심사 기준이 다를 가능성 높음(재확인 필요)',
      sourceUrl: 'https://music.catholic.ac.kr/music/course/academic.do',
      notes:
        '학사정보 페이지 본문에 졸업요건 섹션 자체가 없음 — 의류학과(⑯ 창작물형)처럼 졸업연주/실기심사 방식일 가능성이 높지만 이 페이지만으로는 확정 불가. 공지사항 게시판에서 매학기 공지되는 졸업연주 관련 게시물 확인 필요(크롤러 폴백 대상)',
    },
    // ── 성악과 ──
    {
      id: 36,
      departmentId: 330,
      cohortLabel: '전체(공통, 외국인 전담학과)',
      creditBreakdown: { majorDeep: 56, majorDeepRequired: 20, majorDeepSelect: 36 },
      comprehensiveExam: {
        detail:
          '이수학점 기준만 확인됨(전공 56학점, 복수전공도 동일). 졸업연주/시험/논문 등 구체적 졸업요건은 검색으로 확인하지 못함(voice.catholic.ac.kr/voice/course/academic.do 원문 미열람)',
      },
      substitutionRules: [],
      trackRestrictionNote: '없음(트랙 없음)',
      sourceUrl: 'https://voice.catholic.ac.kr/voice/graduate/academic.do (학부 페이지는 course/academic.do로 추정, 미열람)',
      notes:
        '이수학점표만 확보(대학원 페이지 검색 스니펫에서 확인), 학부 졸업요건 본문은 열람하지 못함 — 외국인 전담학과 특성상 한국어능력 요건이 별도로 있을 가능성 있음',
    },
    // ── 아동학과 (무대체형) ──
    {
      id: 37,
      departmentId: 310,
      cohortLabel: '전체(공통)',
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 69, doubleMajorMin: 36 },
      comprehensiveExam: {
        hasExam: 'Y',
        detail:
          '영유아발달·청소년발달·가족관계·유아교육론·언어지도·특수아동지도 6과목 중 3과목 선택, 평균 90+A/89~80B/79~70C/69~60D/59이하F(F면 졸업불가)',
      },
      substitutionRules: [],
      trackRestrictionNote:
        '심리학과와 동일한 무대체형(패턴 ⑥) — 순수 시험 성적만으로 판정. 보육교사(2급) 자격 취득 희망자는 별도로 소정 전공과목+보육실습 필수 이수. 없음(트랙 없음)',
      sourceUrl: 'https://children.catholic.ac.kr/children/course/academic.do',
      notes: '졸업기준 평점평균 전 학년 2.00 이상 별도 요건 존재. 교직과정 이수자는 별도 교직 기본이수과목 필요. 전공기초 아동학개론 필수(편입생 제외)',
    },
    // ── 프랑스어문화학과 (역방향 대체구조, 패턴 ⑳) ──
    {
      id: 38,
      departmentId: 306,
      cohortLabel: '~22학번/23학번/24학번~/26학번~ (전공학점 4단계로 세분)',
      creditBreakdown: {
        majorDeepMin: 66,
        majorDeepRequired: '3~12(학번별 상이)',
        doubleMajorMin: 36,
        doubleMajorRequired: '3~12(학번별 상이)',
      },
      comprehensiveExam: {
        hasExam: 'N(자격증 기본경로)',
        detail: '졸업시험이 아니라 자격증(DELF B2)이 기본 경로 — 통과 못하면 대체시험(학과 자체 시행)으로 전환',
      },
      mandatoryRequirements: [
        {
          type: 'CERTIFICATE',
          condition: 'DELF B2 취득이 1차(기본) 요건',
          note: 'DELF B2가 자격증이자 졸업요건 그 자체 — 대체가 아니라 이것이 메인 요건임(패턴 ⑳, 다른 학과와 반대 구조)',
        },
      ],
      substitutionRules: [
        {
          type: 'OTHER',
          condition: 'DELF B2 미달 시: DELF B2 응시기록+DELF B1 합격증 제출 후 학과 자체 졸업대체시험 응시 가능',
          note: '이 학과에서는 이 항목이 "대체"이고, DELF B2 취득이 오히려 기본요건 — 대체_* 컬럼 의미가 뒤집히는 사례',
        },
      ],
      trackRestrictionNote:
        '없음(트랙 없음). 이 학과가 국제학부(is) 학생의 "해당 언어학과 졸업요건 대체" 기준으로도 쓰임(국제학부생이 프랑스어 트랙 선택 시 이 학과 졸업요건+토익600 추가 요구)',
      sourceUrl: 'https://french.catholic.ac.kr/french/course/academic.do',
      notes: '전공학점 기준이 매 학번(~22/23/24~25/26~)마다 계속 개정되고 있어 최신 공지 확인이 특히 중요한 학과',
    },
    // ── 글로벌경영학과 ──
    {
      id: 39,
      departmentId: 316,
      cohortLabel: '전체(공통)',
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 66, majorDeepRequired: 12, doubleMajorMin: 36, doubleMajorRequired: 12 },
      comprehensiveExam: {
        hasExam: 'Y(선택3 응시 시)',
        detail:
          '필수(TOPIK4급+) 충족 후 선택 3가지(어학성적/대회입상/졸업시험) 중 택1. 졸업시험 선택 시: 글로벌경영·회계재무·마케팅·생산운영 4개 분야 중 1과목 응시, 100점만점 60점+합격. 해당분야 학점 B0+면 그 과목 면제',
      },
      mandatoryRequirements: [
        { type: 'LANGUAGE', condition: 'TOPIK 4급 이상(전원 공통)', note: '선택(어학/대회입상/졸업시험) 중 택1과 별개로 전원 필수' },
      ],
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition:
            'TOEFL(IBT)82+/NEWTEPS268+/IELTS6.0+/TOEIC Speaking IM1+/OPIC IM2+/JPT700+/JLPT N2+/HSK5급+/DELE B2+/FLEX(서반아)2A+/DELF B1+/FLEX(불어)2A+',
        },
        { type: 'COMPETITION', condition: '경영학전공 주최 학술행사 수상(1~3위)만 인정, 교내창업경진대회·교외입상 불인정' },
      ],
      trackRestrictionNote: '없음(트랙 없음, 단 정원 외 특별전형 학과)',
      sourceUrl: 'https://globalbiz.catholic.ac.kr/globalbiz/course/academic.do',
      notes:
        "학사정보 페이지 이수학점표 첫 줄에 '글로벌경영학과(정원 외)'로 명시 — 특별전형(정원외) 학과임이 확인됨. 수업시간대(오후 수업만 있다는 설)는 이 페이지에서 직접 확인되지 않음(subjects.do 별도 확인 필요). 논문 옵션 없음",
    },
    // ── 바이오메디컬화학공학과 (병렬조건형, 패턴 ⑤) ──
    {
      id: 40,
      departmentId: 340,
      cohortLabel: '2020학번~ (교양 이수구조는 2020/2021/2022학번~ 3단계로 세분)',
      admissionYearFrom: 2020,
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 66, doubleMajorMin: 42 },
      comprehensiveExam: { hasExam: 'N', detail: '졸업시험 없음' },
      mandatoryRequirements: [
        {
          type: 'THESIS',
          condition: '1)졸업논문 2)어학성적 3)4학년1학기 중 상담1회 — 3요건 모두 충족 필요(대체관계 아님, 전원 병렬 필수)',
        },
        {
          type: 'LANGUAGE',
          condition: 'TOEIC600 / NEWTEPS227 / TOEFL69 / TOEIC Speaking110 / TEPS Speaking42 / OPIC IM1 이상 중 하나',
          note: '논문과 무관한 독립요건으로 별도 제출 필요',
        },
        {
          type: 'COUNSELING',
          condition: '4학년 1학기 중 상담 1회 이상',
          note: '복수전공 학생의 경우 1전공 교수 상담으로 대체 가능',
        },
      ],
      substitutionRules: [
        {
          type: 'CERTIFICATE',
          condition:
            '화공기사, 의료기기 규제과학 전문가, 위험물산업기사, 산업안전기사, 가스기사, 화학분석기사, 빅데이터분석기사, ADP, ADsP 등 취득 시 졸업논문 자체를 대체 가능',
        },
      ],
      trackRestrictionNote: '없음(트랙 없음)',
      sourceUrl: 'https://bmce.catholic.ac.kr/bmce/course/academic.do',
      notes:
        '병렬조건형(패턴 ⑤)의 전형적 사례 — 논문/어학/상담 3가지 모두 충족해야 함. 졸업논문(Pass/Fail) 절차: 8월 졸업은 3말 지원서·5/20 초안제출·5/20~30 발표평가(fail시 동영상 재발표)·5/31 제본+어학성적 제출(2월 졸업은 9말~11월 동일 절차)',
    },
    // ── AI의공학과 (신설학과 미확정형, 패턴 ⑲) ──
    {
      id: 41,
      departmentId: 342,
      cohortLabel: '2026학번~ (신설학과)',
      admissionYearFrom: 2026,
      dataSource: 'NOT_YET_ESTABLISHED',
      comprehensiveExam: {
        detail:
          "★2026학년도 신설 예정 학과 — 학과 소개 페이지에 '2026에 신설 예정인 첨단융합학과'로 명시됨. 아직 재학생이 존재하지 않아 졸업요건 자체가 확정·공개되지 않은 상태",
      },
      substitutionRules: [],
      trackRestrictionNote: '없음(트랙 없음, 신설학과)',
      sourceUrl: 'https://aibme.catholic.ac.kr/aibme/info/introduction.do',
      notes:
        '신설 학과라 졸업요건 자체가 아직 없음 — 조사 실패가 아니라 사실관계임. 최초 졸업생은 2030년 2월(2026학번 4년 후) 배출 예정으로 추정. 크롤러는 이 상태 플래그로 무의미한 반복 크롤링을 피해야 함',
    },
    // ── 바이오메디컬소프트웨어학과 (신설학과 미확정형) ──
    {
      id: 42,
      departmentId: 344,
      cohortLabel: '2023학번~ (2023년 신설학과)',
      admissionYearFrom: 2023,
      dataSource: 'NOT_YET_ESTABLISHED',
      comprehensiveExam: {
        detail:
          "2023년 신설 학과로 인공지능학과·데이터사이언스학과와 함께 '융복합 첨단학과 클러스터'로 묶임. 2023학번 기준 2027년 2월이 첫 졸업 예정 시점으로 추정되나, 조사 시점(2026-07)까지 학사정보 페이지에서 졸업시험/논문 관련 구체 요건을 확인하지 못함",
      },
      substitutionRules: [],
      trackRestrictionNote: '두 트랙(디지털헬스케어/의료소프트웨어공학)별로 졸업요건이 다를 가능성 있으나 확인 못함',
      sourceUrl: 'https://bmsw.catholic.ac.kr/bmsw/info/introduction.do',
      notes:
        '아직 첫 졸업생이 배출되지 않았을 가능성이 높음(2023학번 기준 2027년 2월 졸업 예정). AI전자정보융합대학 계열(인공지능학과·데이터사이언스학과)의 어학성적 필수+논문/인턴십/졸업작품 택1 패턴을 채택할 가능성 있음(추정, 확정 아님)',
    },
    // ── 바이오로직스공학부 (신설학과 미확정형, ★사용자 확인) ──
    {
      id: 43,
      departmentId: 341,
      cohortLabel: '신설학과(아직 졸업생 미배출 — 적용 학번 미상)',
      dataSource: 'NOT_YET_ESTABLISHED',
      totalCreditMin: 130,
      creditBreakdown: { majorDeepMin: 54, doubleMajorMin: 36 },
      comprehensiveExam: {
        hasExam: 'N',
        detail:
          '★신설학과 — 학사정보 페이지에 (졸업논문, 어학성적, 상담) 3요건 템플릿이 게시되어 있으나, 아직 이 학과에서 졸업생이 배출되지 않아 실제 적용 여부·시행 학번은 확정되지 않음',
      },
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition: 'TOEIC600 / NEWTEPS227 / TOEFL69 / TOEIC Speaking110 / TEPS Speaking42 / OPIC IM1 이상',
          note: '페이지 게시 내용, 신설학과라 실제 적용 전',
        },
        {
          type: 'CERTIFICATE',
          condition: '바이오의약품제조기사, 생물공학기사, 빅데이터분석기사, 화학분석기사, 바이오정보분석사, 정보처리기사, 산업안전기사',
          note: '페이지 게시 내용, 신설학과라 실제 적용 전 — 졸업논문 대체용',
        },
        { type: 'THESIS', condition: '졸업논문(Pass/Fail) — 위 자격증으로 대체 가능', note: '페이지 게시 내용, 실제 적용 전' },
      ],
      trackRestrictionNote: '재학 기간 중 상담 1회 이상(페이지 게시 내용, 실제 적용 전). 없음(트랙 없음)',
      sourceUrl: 'https://ble.catholic.ac.kr/BLE/course/academic.do',
      notes:
        '★사용자 확인: 신설과라서 실제로는 졸업요건이 없는 상태(적용된 적 없음) — bmce와 거의 동일한 템플릿을 미리 게시해둔 것으로 보이나 첫 졸업생이 나오기 전까지 실질적 구속력 없을 수 있음(패턴 ⑲). URL 마이그레이션(www.catholic.ac.kr/BLE → ble.catholic.ac.kr)은 여전히 유효한 발견',
    },
    // ── 아래부터는 WebSearch 스니펫 기반 조사행 (패턴 ⑮, dataSource: SEARCH_SNIPPET / verified:false) ──
    // ── 중국언어문화학과 ──
    {
      id: 44,
      departmentId: 304,
      cohortLabel: '전체(공통)',
      dataSource: 'SEARCH_SNIPPET',
      verified: false,
      comprehensiveExam: {
        hasExam: 'Y(조건부)',
        detail:
          "학과 공지사항(2025-1학기 '자격증 제출, 졸업시험 신청 및 졸업논문, 번역 신청 안내' 등)을 통해 졸업시험/졸업논문/번역/자격증 제출 중 하나를 선택·신청하는 구조로 운영되는 것이 확인됨(매 학기 초 마감). 각 경로의 구체적 문항 구성·합격기준·신청 자격요건은 원문 미확인",
      },
      mandatoryRequirements: [
        {
          type: 'WORKSHOP',
          condition: "4학년 대상 '워크샵' 1회 참여 필요",
          note: '2025학번까지는 워크샵 미참여자의 경우 학술제 1회 참여로 대체 가능(워크샵 참여자는 학술제 참여 불요). 본 요건과 별개인지 통합인지는 원문 미확인',
        },
      ],
      substitutionRules: [
        { type: 'CERTIFICATE', condition: '자격증 제출 경로 존재(HSK 등 중국어 어학자격증으로 추정, 등급/점수 미확인)' },
        { type: 'THESIS', condition: '졸업논문 제출(졸업시험/번역/자격증과 택1로 추정, 심사기준 미확인)' },
        { type: 'OTHER', condition: '번역 제출(졸업시험/졸업논문/자격증과 택1로 추정)' },
      ],
      trackRestrictionNote: '없음(트랙 구분 없음)',
      sourceUrl:
        'https://cn.catholic.ac.kr/cn/community/notice.do?mode=view&articleNo=264564 ; https://cn.catholic.ac.kr/cn/community/notice.do?mode=view&articleNo=258475',
      notes:
        SNIPPET_NOTE_PREFIX +
        'WebFetch로 cn.catholic.ac.kr 직접 접속이 403으로 차단되어 검색엔진 스니펫만으로 파악함. 졸업최저이수학점, 각 대체경로의 구체적 합격기준·점수·등급, 트랙 존재 여부, 학번별 요건 차이는 확인 못함. 원문 게시글 전문 미열람.',
    },
    // ── 일어일본문화학과 ──
    {
      id: 45,
      departmentId: 305,
      cohortLabel: '전체(공통)',
      dataSource: 'SEARCH_SNIPPET',
      verified: false,
      comprehensiveExam: {
        hasExam: 'Y(조건부)',
        detail:
          "학과 홈페이지 '졸업규정'(law.do) 페이지에서 확인됨. 졸업인증 방법으로 (1)졸업논문 작성 (2)번역 (3)JLPT/JPT 어학시험 합격 중 택1. 논문 작성 자격은 선수과목 '일본어학세미나' 이수 필수(미이수시 자격 없음). 번역 자격은 '일한번역의 이론과 실제' 또는 '일한번역세미나' 이수 필수. 신청 이후 방법 변경은 논문↔JLPT/JPT만 허용, 논문↔번역·번역↔JLPT/JPT 변경 불가. 어학시험 성적은 재학 중 7학기 이내 취득분만 인정(8학기 취득분 불인정)",
      },
      substitutionRules: [
        { type: 'LANGUAGE', condition: 'JLPT 또는 JPT 시험 합격(구체 급수/점수 기준 검색으로 확인 안됨). 재학 중 7학기 이내 취득분만 인정' },
        { type: 'THESIS', condition: '졸업논문 작성 — 선수과목 일본어학세미나 이수 필요' },
        { type: 'OTHER', condition: '번역(일한번역) 제출 — 선수과목(일한번역의 이론과 실제/일한번역세미나) 이수 필요' },
      ],
      trackRestrictionNote: '없음(트랙 구분 없음). 단 졸업인증 방법(논문/번역/JLPT·JPT) 간 상호 변경에는 제한이 있음',
      sourceUrl: 'https://japanese.catholic.ac.kr/japanese/major/law.do',
      notes:
        SNIPPET_NOTE_PREFIX +
        'WebFetch로 japanese.catholic.ac.kr 직접 접속이 403으로 차단되어 검색엔진 스니펫만으로 파악함. JLPT/JPT 구체 합격 급수·점수, 졸업최저이수학점, 전공선택학점은 확인 못함. 비공식 출처(대학백과 Q&A)의 "21학번부터 요건 1개 추가" 언급은 공식 확인 안 되어 미채택.',
    },
    // ── 국제경영학과 ──
    {
      id: 46,
      departmentId: 333,
      cohortLabel: '전체(공통, 2025.5 개정 반영)',
      dataSource: 'SEARCH_SNIPPET',
      verified: false,
      comprehensiveExam: {
        hasExam: 'Y(조건부)',
        detail:
          '졸업요건은 졸업종합시험/어학성적/대회 입상/자격증 중 택1(2025년 5월 개정, 구 학과명 글로벌미래경영학과 시절 문서 포함). 졸업종합시험 3과목: 글로벌마케팅의이해(06816), 글로벌경영의이해(06798), 글로벌인적자원의이해(06799). 과목별 100점만점 60점 이상 합격, 3과목 모두 합격 시 최종 합격. 캡스톤디자인 2과목 이수 시 시험 1과목 면제(최대 2과목)',
      },
      substitutionRules: [
        { type: 'LANGUAGE', condition: 'TOEIC 700점 이상 및 이에 준하는 공인 외국어 성적(입학 후 취득 성적에 한함)' },
        { type: 'CERTIFICATE', condition: '경제경영이해력인증시험 매경TEST 우수 이상 등(입학 후 취득한 자격/시험 합격에 한함)' },
        {
          type: 'COMPETITION',
          condition:
            '① 교내 수상: 장려상 이상(창업경진대회, 캡스톤디자인 경진대회, 프레젠테이션 대회 등) ② 교외 기업/기관 주최 공모전 수상: 장려상 이상',
        },
      ],
      trackRestrictionNote: '없음(트랙 구분 없음)',
      sourceUrl:
        'https://gbs.catholic.ac.kr/gbs/course/graduation1.do ; https://gbs.catholic.ac.kr/gbs/community/notice.do?mode=view&articleNo=265617',
      notes:
        SNIPPET_NOTE_PREFIX +
        '국제경영학과는 前 글로벌미래경영학과이며 2025년 5월 졸업요건이 개정됨. 개정 전/후 적용 학번 구간, 졸업최저이수학점, 전공선택학점, 트랙 존재 여부는 확인 못함. 국제학부(is.catholic.ac.kr)와는 전혀 다른 학과이므로 혼동 주의. 졸업논문 옵션 확인 안 됨.',
    },
    // ── 세무회계금융학과 ──
    {
      id: 47,
      departmentId: 334,
      cohortLabel: '전체(공통)',
      dataSource: 'SEARCH_SNIPPET',
      verified: false,
      comprehensiveExam: {
        hasExam: 'Y(조건부)',
        detail:
          '졸업요건은 졸업종합시험/어학성적/대회 입상/자격증 중 택1. 졸업종합시험 3과목: 회계학개론(06806), 기초원가회계(06802), 조세법의이해(06804). 과목별 100점만점 60점 이상 합격, 3과목 모두 합격 시 최종 합격. 캡스톤디자인 2과목 이수 시 1과목 면제(최대 2과목). 과목코드가 회계학과와 동일하게 검색되어 공통교과목(가톨릭공유대학 CU12 등) 가능성 있으나 교차검증 못함',
      },
      substitutionRules: [
        { type: 'LANGUAGE', condition: 'TOEIC 700점 이상, TOEFL(IBT) 80점 이상, NEW TEPS 265점 이상, JPT 700점 이상, JLPT N2 이상, HSK 5급 이상 등' },
        { type: 'CERTIFICATE', condition: '경제경영이해력인증시험 매경TEST 우수 이상' },
        {
          type: 'COMPETITION',
          condition: '① 교내 수상: 장려상 이상(창업경진대회 등) ② 교외 기업/기관 주최 공모전 수상: 장려상 이상',
        },
      ],
      trackRestrictionNote: '없음(트랙 구분 없음)',
      sourceUrl: 'https://gbs.catholic.ac.kr/gbs/course/graduation2.do ; https://gbs.catholic.ac.kr/gbs/course/roadmap02.do',
      notes:
        SNIPPET_NOTE_PREFIX +
        '졸업종합시험 과목코드가 회계학과와 동일하게 검색되어 교차확인 필요(검색엔진 요약 과정에서 다른 학과 정보와 혼합됐을 가능성 배제 못함). 졸업최저이수학점, 전공선택학점, 정확한 적용 학번, 트랙 존재 여부는 확인 못함.',
    },
    // ── IT파이낸스학과 ──
    {
      id: 48,
      departmentId: 335,
      cohortLabel: '전체(공통)',
      dataSource: 'SEARCH_SNIPPET',
      verified: false,
      comprehensiveExam: {
        hasExam: 'Y(조건부)',
        detail:
          "학과 공식 '졸업요건 요약' 문서(공지 첨부파일)에는 '졸업종합시험, 어학성적, 대회 입상 중 택1'로 명시됨(자격증 포함 여부는 검색 결과 간 불일치 있어 불확실). 졸업종합시험 과목: 회계학의이해1,2(07019,07020), 재무와자본시장(07018), IT파이낸스프로그래밍(07014) — 과목 코드 4개 나열되어 실제 응시과목 수(3 vs 4)가 다른 학과와 다를 수 있어 정확히 확인 못함. 과목별 100점만점 60점 이상 합격, 캡스톤디자인 2과목 이수 시 1과목 면제로 추정",
      },
      substitutionRules: [
        { type: 'LANGUAGE', condition: '택1 항목 중 하나로 이름만 확인, 구체 점수 기준(예: 토익 700 상당 여부) 원문에서 확인 못함' },
        { type: 'CERTIFICATE', condition: '일부 검색결과에는 택1 항목 포함으로 나왔으나 학과 공식 문서 제목 스니펫엔 3가지(시험/어학/대회)만 명시 — 포함 여부 자체가 불확실' },
        {
          type: 'COMPETITION',
          condition: '① 교내 수상: 장려상 이상(창업경진대회 등) ② 교외 기업/기관 주최 공모전 수상: 장려상 이상',
        },
      ],
      trackRestrictionNote: '없음(트랙 구분 없음)',
      sourceUrl: 'https://gbs.catholic.ac.kr/gbs/course/graduation3.do',
      notes:
        SNIPPET_NOTE_PREFIX +
        '택1 항목에 자격증 포함 여부, 어학성적 구체 기준 점수, 졸업종합시험 실제 응시과목 수(과목코드 4개 vs 과목명 3개 불일치) 확인 못함. 졸업최저이수학점·전공선택학점·적용학번·트랙 존재 여부도 확인 못함. graduation3.do 및 첨부파일 원문 직접 확인 필요.',
    },
    // ── 약학과 (2+4년제/통합6년제, 패턴 ⑤) ──
    {
      id: 49,
      departmentId: 336,
      cohortLabel: '~2021학번(2+4년제, 구제도로 추정)',
      admissionYearTo: 2021,
      dataSource: 'SEARCH_SNIPPET',
      verified: false,
      totalCreditMin: 158,
      creditBreakdown: { generalBasic: 4, majorRequired: 134, majorSelect: 20 },
      comprehensiveExam: {
        hasExam: 'Y',
        detail: '졸업기준 평점평균(전 학년) 2.00 이상 + 종합시험 합격 필요. 등급 세분(A/B/C/F) 적용 여부는 통합6년제와 동일한지 확인 못함',
      },
      substitutionRules: [],
      trackRestrictionNote: '없음(트랙 구분 없음)',
      sourceUrl: 'https://pharmacy.catholic.ac.kr/pharmacy/graduate/academic.do',
      notes:
        SNIPPET_NOTE_PREFIX +
        '2022학번부터 전국 약대가 통합6년제로 전환되면서 2+4년제는 구제도가 된 것으로 추정되나 정확히 어느 학번까지 적용됐는지 확정 못함. 대학원(graduate) URL 경로에 학부 학사정보가 게재된 것인지도 불명확. 2+4년제에서 별도 졸업논문 요건이 있었는지 확인 못함.',
    },
    {
      id: 50,
      departmentId: 336,
      cohortLabel: '2022학번~(통합6년제)',
      admissionYearFrom: 2022,
      dataSource: 'SEARCH_SNIPPET',
      verified: false,
      totalCreditMin: 237,
      creditBreakdown: { majorRequired: 171, majorSelect: 22, majorBasic: 15, generalRequired: 11, coreRequired: 18 },
      comprehensiveExam: {
        hasExam: 'Y',
        detail:
          '약사국가고시 연계 과목(생명약학, 산업약학, 임상·실무약학1·2, 보건·의약관계법규)으로 진행되는 종합시험. 1차시험 합격자 A등급, 2차시험 합격자 B등급, 3차시험 합격자 C등급, 불합격자 F등급',
      },
      mandatoryRequirements: [
        {
          type: 'LANGUAGE',
          condition: '외국어능력시험(TOEIC 800점 이상 또는 상응 공인영어성적)을 입학 이후 취득한 성적으로 6학년 2학기 15주차 말일까지 제출',
          note: '대체(면제) 개념 아님 — 졸업시험·졸업논문과 별개로 반드시 병행 충족(AND 조건)',
        },
        {
          type: 'THESIS',
          condition:
            '졸업논문(연구심화실습 연계) 자체가 필수요건. 3학년 1학기부터 연구심화실습 시작 가능, 5학년 1학기 전 최대 1회 지도교수 변경, 선수강 최대 150시간 인정, 4학년 2학기 겨울방학부터 총 350시간 중 잔여시간 수행, 6학년 1학기 약학논문 과목 P/F 평가',
          note: '대체(면제) 개념 아님 — 필수요건. 연구윤리 서약서 서명 필요',
        },
      ],
      substitutionRules: [],
      trackRestrictionNote: '없음(트랙 구분 없음, 전원 동일하게 외국어능력시험+졸업논문+졸업시험 모두 충족 필요 — 병렬조건형)',
      sourceUrl: 'https://pharmacy.catholic.ac.kr/pharmacy/graduate/academic.do',
      notes:
        SNIPPET_NOTE_PREFIX +
        'TOEIC 800점 기준은 스니펫에서 확인했으나 원문 표 전체(TEPS/TOEFL 등 타 어학시험 환산 기준)는 열람 못함. 학부 학사정보 전용 URL(예: academic-information.do 등)이 별도 존재할 가능성 있으나 특정 못함.',
    },
    // ── 생명공학과 (전공자 유형별 완화, 패턴 ⑭) ──
    {
      id: 51,
      departmentId: 339,
      scope: 'FIRST_MAJOR',
      cohortLabel: '전체(공통) — 1전공자(전공심화 포함)',
      dataSource: 'SEARCH_SNIPPET',
      verified: false,
      comprehensiveExam: {
        hasExam: 'Y(조건부)',
        detail:
          "학과 공지에서 '졸업논문/졸업시험'이 하나의 요건으로 병기되어 제시됨 — 논문 또는 시험 중 하나로 충족 가능한 구조로 추정되나 구체적 시험 과목·합격기준·논문 분량 등은 확인 못함",
      },
      mandatoryRequirements: [
        {
          type: 'CAREER_COUNSELING',
          condition: '4학년 취업상담 1회 참여',
          note: '대체 아닌 별도 필수 요건, 1전공자에게만 해당(복수전공자는 면제)',
        },
      ],
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition: '어학성적 총 2회 제출 필요 — 1회는 졸업시험 1과목 면제 목적, 1회는 졸업요건 충족용 별도 제출',
          note: '구체 기준 점수(TOEIC 등) 확인 못함',
        },
        { type: 'THESIS', condition: '졸업논문은 졸업시험과 상호 대체(택1) 가능한 관계로 추정(정확한 조건·절차 확인 못함)' },
      ],
      trackRestrictionNote: '1전공자(전공심화 포함)에게만 적용. 복수전공자(2전공)는 어학성적/취업상담 요건 면제, 논문/시험만 충족하면 됨',
      sourceUrl: 'https://biotech.catholic.ac.kr/biotech/community/notice.do?mode=view&articleNo=115184',
      notes:
        SNIPPET_NOTE_PREFIX +
        "2023-2학기 '★중요★ 졸업요건 제출일정 안내' 공지 스니펫 기반. 어학성적 구체 기준 점수, 졸업시험 과목, 졸업최저이수학점 등 숫자 정보 확인 불가. 한시적 안내인지 상시 규정인지 불명확하여 '전체(공통)'으로 잠정 처리.",
    },
    {
      id: 52,
      departmentId: 339,
      scope: 'DOUBLE_MAJOR',
      cohortLabel: '전체(공통) — 복수전공자(생명공학이 2전공인 경우)',
      dataSource: 'SEARCH_SNIPPET',
      verified: false,
      comprehensiveExam: {
        hasExam: 'Y(조건부)',
        detail: '복수전공자는 어학성적 제출·취업상담 요건이 면제되고, 졸업논문 또는 졸업시험 중 하나만 충족하면 됨. 구체 시험 과목·기준 확인 못함',
      },
      mandatoryRequirements: [],
      substitutionRules: [
        { type: 'THESIS', condition: '졸업논문/졸업시험 중 택1 가능한 구조로 추정(1전공자와 동일한 대체관계, 정확한 조건 확인 못함)' },
      ],
      trackRestrictionNote: '복수전공자(생명공학이 2전공인 경우)에게만 완화 적용됨. 1전공자(전공심화 포함)는 어학성적·취업상담을 추가로 충족해야 함',
      sourceUrl: 'https://biotech.catholic.ac.kr/biotech/community/notice.do?mode=view&articleNo=115184',
      notes:
        SNIPPET_NOTE_PREFIX +
        '위 1전공자 행과 동일한 공지(2023-2학기) 기반. 원문 미열람으로 세부 숫자 확인 불가. 이 완화 규정이 현재도 유효한지 재확인 필요. 어학성적 제출/취업상담 면제는 명시적으로 확인되어 mandatoryRequirements를 빈 배열로 확정함.',
    },
    // ── 특수교육과 ──
    {
      id: 53,
      departmentId: 311,
      cohortLabel: '전체(공통)',
      dataSource: 'SEARCH_SNIPPET',
      verified: false,
      creditBreakdown: { majorMin: 66, teachingCredits: 22, teachingRequired: 10 },
      comprehensiveExam: {
        hasExam: 'Y(조건부)',
        detail:
          "매 학기 '졸업대상자 종합시험(졸업시험) 신청 안내' 공지 확인. 졸업요건 경로로 졸업시험/졸업논문/대체인정이 함께 언급되며, '졸업성적(자격증)'을 취득한 학생은 종합시험 응시 불필요(면제)라는 문구 확인됨",
      },
      substitutionRules: [
        {
          type: 'LANGUAGE',
          condition: '최근 2년 이내 TOEIC 700점 이상/TOEFL CBT 200점 이상/TOEFL iBT 80점 이상/TEPS 550점 이상 중 하나',
          note: '종합시험의 대체인지 별도 병행 필수요건인지 원문 미확인',
        },
        { type: 'CERTIFICATE', condition: "'졸업성적(자격증)' 제도로 종합시험 면제 — 구체적으로 어떤 자격증이 인정되는지는 미확인" },
        { type: 'THESIS', condition: '졸업논문 제출도 졸업요건 충족 경로 중 하나로 언급(택1 구조로 추정, 상세 절차 미확인)' },
      ],
      trackRestrictionNote: '없음(트랙 구분 없음)',
      sourceUrl:
        'https://sped.catholic.ac.kr/sped/community/Bachelor.do?mode=view&articleNo=265525 ; https://sped.catholic.ac.kr/sped/course/academic.do',
      notes:
        SNIPPET_NOTE_PREFIX +
        '교원자격증(특수학교 정교사) 연계 학과라 교직과목 요건이 중요하나 WebSearch 요약 스니펫에만 의존했음. 졸업최저이수학점 구체 수치, 종합시험 면제 인정 자격증 목록, 어학성적이 택1 대체인지 공통 필수인지는 원문 직접 열람 재확인 필요.',
    },
    // ── 국제학부 (트랙 4종, 필수+선택 혼합형, 패턴 ①④⑪) ──
    {
      id: 54,
      departmentId: 312,
      trackId: 16,
      cohortLabel: '전체(공통, 2013학번 이후 현행 트랙제도 적용)',
      dataSource: 'SEARCH_SNIPPET',
      verified: false,
      comprehensiveExam: {
        hasExam: 'N',
        detail:
          '별도의 졸업종합시험은 검색상 확인되지 않음. 대신 [졸업논문+어학성적+영어강의] 또는 [자격증+어학성적+영어강의] 중 택1 구조로 검색됨(병렬조건형)',
      },
      mandatoryRequirements: [
        {
          type: 'LANGUAGE',
          condition: '어학성적(TOEFL iBT 100점, TEPS 800점 기준이 언급되나 원문 대조 못해 신뢰도 낮음)',
          note: '졸업논문 경로/자격증 경로 모두에 공통으로 요구되는 병행 필수요건',
        },
        { type: 'FOREIGN_LANGUAGE_COURSE', condition: '영어강의 이수(구체 이수 과목 수/학점 미확인)', note: '어학성적과 별도로 공통 필수' },
      ],
      substitutionRules: [
        { type: 'THESIS', condition: '졸업논문 제출(자격증 경로와 양자택일)' },
        {
          type: 'CERTIFICATE',
          condition: '관세사, 국제물류사, 원산지관리사, 국제무역사 1급, 무역영어 1급, 외환전문역 1종/2종, 물류관리사 등',
        },
      ],
      trackRestrictionNote:
        "국제학부는 미국학/중국학/국제관계학/국제통상학 4개 트랙으로 구성. 융복합트랙은 졸업(수료) 요건과 무관해서 이수요건 못 채워도 본전공 요건만 충족하면 자동 졸업됨(패턴 ④, 이 트랙과 혼동 주의)",
      sourceUrl:
        'https://is.catholic.ac.kr/is/community/notice.do?mode=view&articleNo=239259 ; https://is.catholic.ac.kr/is/course/academic.do',
      notes:
        SNIPPET_NOTE_PREFIX +
        '4개 트랙 각각 동일한 졸업요건 공식이 적용된다고 가정해 행을 분리했으나 트랙별 차이가 실제로 없는지는 원문 대조 필요. 어학성적 수치(TOEFL iBT 100/TEPS 800)는 신뢰도 낮은 검색 요약.',
    },
    {
      id: 55,
      departmentId: 312,
      trackId: 17,
      cohortLabel: '전체(공통, 2013학번 이후 현행 트랙제도 적용)',
      dataSource: 'SEARCH_SNIPPET',
      verified: false,
      comprehensiveExam: {
        hasExam: 'N',
        detail: '별도의 졸업종합시험은 검색상 확인되지 않음. 대신 [졸업논문+어학성적+영어강의] 또는 [자격증+어학성적+영어강의] 중 택1 구조(병렬조건형)',
      },
      mandatoryRequirements: [
        { type: 'LANGUAGE', condition: '어학성적(TOEFL iBT 100점, TEPS 800점 기준 언급되나 신뢰도 낮음)', note: '두 경로 모두 공통 필수' },
        { type: 'FOREIGN_LANGUAGE_COURSE', condition: '영어강의 이수(구체 이수 과목 수/학점 미확인)', note: '어학성적과 별도로 공통 필수' },
      ],
      substitutionRules: [
        { type: 'THESIS', condition: '졸업논문 제출(자격증 경로와 양자택일)' },
        {
          type: 'CERTIFICATE',
          condition: '관세사, 국제물류사, 원산지관리사, 국제무역사 1급, 무역영어 1급, 외환전문역 1종/2종, 물류관리사 등',
        },
      ],
      trackRestrictionNote: '4개 트랙 공통 적용으로 보임(트랙별 차등 규정 검색상 발견 못함)',
      sourceUrl:
        'https://is.catholic.ac.kr/is/community/notice.do?mode=view&articleNo=239259 ; https://is.catholic.ac.kr/is/course/academic.do',
      notes: SNIPPET_NOTE_PREFIX + '4개 트랙에 동일 공식이 적용된다고 가정해 행을 분리했으나 트랙별 차이 실재 여부는 원문 대조 필요.',
    },
    {
      id: 56,
      departmentId: 312,
      trackId: 18,
      cohortLabel: '전체(공통, 2013학번 이후 현행 트랙제도 적용)',
      dataSource: 'SEARCH_SNIPPET',
      verified: false,
      comprehensiveExam: {
        hasExam: 'N',
        detail: '별도의 졸업종합시험은 검색상 확인되지 않음. 대신 [졸업논문+어학성적+영어강의] 또는 [자격증+어학성적+영어강의] 중 택1 구조(병렬조건형)',
      },
      mandatoryRequirements: [
        { type: 'LANGUAGE', condition: '어학성적(TOEFL iBT 100점, TEPS 800점 기준 언급되나 신뢰도 낮음)', note: '두 경로 모두 공통 필수' },
        { type: 'FOREIGN_LANGUAGE_COURSE', condition: '영어강의 이수(구체 이수 과목 수/학점 미확인)', note: '어학성적과 별도로 공통 필수' },
      ],
      substitutionRules: [
        { type: 'THESIS', condition: '졸업논문 제출(자격증 경로와 양자택일)' },
        {
          type: 'CERTIFICATE',
          condition: '관세사, 국제물류사, 원산지관리사, 국제무역사 1급, 무역영어 1급, 외환전문역 1종/2종, 물류관리사 등',
        },
      ],
      trackRestrictionNote: '4개 트랙 공통 적용으로 보임',
      sourceUrl:
        'https://is.catholic.ac.kr/is/community/notice.do?mode=view&articleNo=239259 ; https://is.catholic.ac.kr/is/course/academic.do',
      notes: SNIPPET_NOTE_PREFIX + '4개 트랙에 동일 공식이 적용된다고 가정해 행을 분리했으나 트랙별 차이 실재 여부는 원문 대조 필요.',
    },
    {
      id: 57,
      departmentId: 312,
      trackId: 19,
      cohortLabel: '전체(공통, 2013학번 이후 현행 트랙제도 적용)',
      dataSource: 'SEARCH_SNIPPET',
      verified: false,
      comprehensiveExam: {
        hasExam: 'N',
        detail: '별도의 졸업종합시험은 검색상 확인되지 않음. 대신 [졸업논문+어학성적+영어강의] 또는 [자격증+어학성적+영어강의] 중 택1 구조(병렬조건형)',
      },
      mandatoryRequirements: [
        { type: 'LANGUAGE', condition: '어학성적(TOEFL iBT 100점, TEPS 800점 기준 언급되나 신뢰도 낮음)', note: '두 경로 모두 공통 필수' },
        { type: 'FOREIGN_LANGUAGE_COURSE', condition: '영어강의 이수(구체 이수 과목 수/학점 미확인)', note: '어학성적과 별도로 공통 필수' },
      ],
      substitutionRules: [
        { type: 'THESIS', condition: '졸업논문 제출(자격증 경로와 양자택일)' },
        {
          type: 'CERTIFICATE',
          condition: '관세사, 국제물류사, 원산지관리사, 국제무역사 1급, 무역영어 1급, 외환전문역 1종/2종, 물류관리사 등',
          note: '국제통상학 트랙과 연관성 높아 보이나 트랙 한정 여부 미확인',
        },
      ],
      trackRestrictionNote: '4개 트랙 공통 적용으로 보임',
      sourceUrl:
        'https://is.catholic.ac.kr/is/community/notice.do?mode=view&articleNo=239259 ; https://is.catholic.ac.kr/is/course/academic.do',
      notes: SNIPPET_NOTE_PREFIX + '4개 트랙에 동일 공식이 적용된다고 가정해 행을 분리했으나 트랙별 차이 실재 여부는 원문 대조 필요.',
    },
  ];

  for (const r of GRADUATION_REQUIREMENTS) {
    await prisma.catalogGraduationRequirement.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        departmentId: r.departmentId,
        trackId: r.trackId ?? null,
        scope: r.scope ?? 'ALL',
        cohortLabel: r.cohortLabel,
        admissionYearFrom: r.admissionYearFrom ?? null,
        admissionYearTo: r.admissionYearTo ?? null,
        basis: r.basis ?? 'ADMISSION_YEAR',
        graduationDateFrom: r.graduationDateFrom ?? null,
        totalCreditMin: r.totalCreditMin ?? null,
        creditBreakdown: r.creditBreakdown ?? Prisma.JsonNull,
        scoringMethod: r.scoringMethod ?? 'PASS_FAIL',
        comprehensiveExam: r.comprehensiveExam ?? Prisma.JsonNull,
        scoreItems: r.scoreItems ?? Prisma.JsonNull,
        pointThreshold: r.pointThreshold ?? null,
        mandatoryRequirements: r.mandatoryRequirements ?? Prisma.JsonNull,
        substitutionRules: r.substitutionRules ?? [],
        languageScoreStandard: r.languageScoreStandard ?? Prisma.JsonNull,
        thesisOptional: r.thesisOptional ?? false,
        trackRestrictionNote: r.trackRestrictionNote ?? null,
        dataSource: r.dataSource ?? 'PAGE_DIRECT',
        verified: r.verified ?? true,
        sourceUrl: r.sourceUrl ?? null,
        attachmentUrl: r.attachmentUrl ?? null,
        notes: r.notes ?? null,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `시드 완료: 가톨릭대학교 성심교정 / 계열 ${COLLEGES.length}개 / 학과 ${DEPARTMENTS.length + 3}개(행정단위 4개 포함) / 트랙 ${TRACKS.length + 1}개 / 졸업요건 ${GRADUATION_REQUIREMENTS.length}건(SEARCH_SNIPPET ${GRADUATION_REQUIREMENTS.filter((r) => r.dataSource === 'SEARCH_SNIPPET').length}건 포함)`,
  );
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
