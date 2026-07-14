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
}

// 가톨릭대_학과_계열_매핑.xlsx "학과매핑" 시트 52행 그대로 옮김(실제확인된 URL 컬럼 기준).
// 컴퓨터정보공학부(101)/경영학과(102)/데이터사이언스(205)는 기존 시드 ID를 그대로 유지.
const DEPARTMENTS: DepartmentSeed[] = [
  // college 1: 인문사회계열
  { id: 300, collegeId: 1, name: '국어국문학과', domainSlug: 'korean', baseUrl: 'https://korean.catholic.ac.kr' },
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

  // college 5~7: 자유전공/융합전공/교직과정
  { id: 325, collegeId: 5, name: '자유전공학부', domainSlug: 'liberal', baseUrl: 'https://liberal.catholic.ac.kr' },
  {
    id: 326,
    collegeId: 6,
    name: '융합전공학부',
    domainSlug: 'major-convergence',
    baseUrl: 'https://major-convergence.catholic.ac.kr',
  },
  { id: 327, collegeId: 7, name: '교직과', domainSlug: 'teaching', baseUrl: 'https://teaching.catholic.ac.kr' },

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
  { id: 330, collegeId: 9, name: '성악과', domainSlug: 'voice', baseUrl: 'https://voice.catholic.ac.kr' },
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

  const business = await prisma.department.upsert({
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
      },
    });
  }

  const math = await prisma.department.findUniqueOrThrow({ where: { id: 319 } });

  await prisma.track.upsert({
    where: { id: 11 },
    update: {},
    create: { id: 11, departmentId: cse.id, name: '심화 전공 트랙', requiredCourseCount: 3 },
  });

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

  // 졸업요건: 실제 학과 사이트(csie/business/math의 course/academic.do)에서 확인한 값 그대로 입력.
  // "트랙별 필수과목" 모델이 아니라 "졸업종합시험 + 대체규정" 모델 — CatalogGraduationRequirement 참고.
  await prisma.catalogGraduationRequirement.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      departmentId: cse.id,
      admissionYearFrom: 2018,
      totalCreditMin: 130,
      creditBreakdown: { general: 25, generalBasicRequired: 16, generalCore: 9, majorBasic: 15, major: 36 },
      comprehensiveExam: { majorRequiredCount: 4, doubleMajorRequiredCount: 3 },
      substitutionRules: [
        { type: 'TOEIC', condition: '801점 이상', waives: 3 },
        { type: 'TOEIC', condition: '701~800점', waives: 2 },
        { type: 'TOEIC', condition: '601~700점', waives: 1 },
        { type: 'THESIS', condition: '학술지 발표 또는 장학생 심사 통과', waives: null },
        { type: 'CERTIFICATE', condition: '국가/국제 공인자격증(정보처리기사 등)', waives: null },
        { type: 'COMPETITION', condition: 'IT 대회 입상(ACM ICPC 등)', waives: null },
      ],
      thesisOptional: true,
    },
  });

  await prisma.catalogGraduationRequirement.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      departmentId: business.id,
      admissionYearFrom: 2018,
      totalCreditMin: null, // 학번별로 상이 — 온라인 미공개, 신입생 오리엔테이션 책자 참고
      comprehensiveExam: Prisma.JsonNull, // 내국인 학생은 졸업종합시험 없음(외국인 학생 전용 별도 제도)
      substitutionRules: [],
      languageScoreStandard: { TOEIC: 700, TOEFL_IBT: 82, NEW_TEPS: 268, JPT: 700, IELTS: 6.0 },
      thesisOptional: true,
    },
  });

  await prisma.catalogGraduationRequirement.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      departmentId: math.id,
      admissionYearFrom: 2025, // "2025년 2월 졸업대상자부터 적용"
      creditBreakdown: { majorDeepMin: 66, majorDeepRequired: 12, doubleMajorMin: 36, doubleMajorRequired: 12, minorMin: 21 },
      comprehensiveExam: {
        requiredAreas: ['해석학개론', '선형대수학'],
        electiveAreas: ['대수학', '위상기하', '통계학', '금융수학', '계산수학', '인공지능'],
        majorRequiredCount: 4,
        doubleMajorRequiredCount: 3,
        passingRule: '전체 평균 60점 이상(75점 이상 A, 60~74점 B), 각 영역 40점 이상',
      },
      substitutionRules: [
        { type: 'TOEIC', condition: '650점 이상', waives: 1, note: '선택영역 1개' },
        { type: 'TOEIC', condition: '750점 이상', waives: 2, note: '선택영역 1개 + 필수영역 1개' },
        { type: 'TOEIC', condition: '850점 이상', waives: 3, note: '선택영역 1개 + 필수영역 2개' },
        { type: 'CERTIFICATE', condition: '펀드투자권유대행인, 증권투자권유대행인 중 1개 취득', waives: 1, note: '금융수학영역 대체' },
        { type: 'COMPETITION', condition: '학술제 수상', waives: 1, note: '선택영역 1개' },
      ],
    },
  });

  // eslint-disable-next-line no-console
  console.log(
    `시드 완료: 가톨릭대학교 성심교정 / 계열 ${COLLEGES.length}개 / 학과 ${DEPARTMENTS.length + 3}개 / 심화 전공 트랙 / 졸업요건(csie·business·math) 3건`,
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
