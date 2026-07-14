import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const university = await prisma.university.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: '가톨릭대학교 성심교정', supported: true },
  });

  const cse = await prisma.department.upsert({
    where: { id: 101 },
    update: {},
    create: { id: 101, universityId: university.id, name: '컴퓨터정보공학부', catalogReady: true },
  });

  await prisma.department.upsert({
    where: { id: 102 },
    update: {},
    create: { id: 102, universityId: university.id, name: '경영학과', catalogReady: false },
  });

  await prisma.department.upsert({
    where: { id: 205 },
    update: {},
    create: { id: 205, universityId: university.id, name: '데이터사이언스', catalogReady: false },
  });

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

  // 컴퓨터정보공학부 요람 데이터 1차 수동 시딩(착수 단계) — 디자인 핸드오프(졸업학점계산기.dc.html)
  // 목업 시간표에 등장하는 과목 기준. 학번 구간별 이수구분 변경 등 세부 조정은 다음 이슈(요람 매칭 엔진)에서.
  const cseCatalogCourses: Array<{
    id: number;
    name: string;
    code: string;
    category: string;
    credit: number;
    admissionYearFrom: number;
  }> = [
    { id: 7001, name: '프로그래밍및실습', code: 'CSE1001', category: '전공필수', credit: 3, admissionYearFrom: 2018 },
    { id: 7002, name: '자료구조와알고리즘', code: 'CSE2011', category: '전공필수', credit: 3, admissionYearFrom: 2018 },
    { id: 7003, name: '데이터베이스시스템', code: 'CSE3021', category: '전공필수', credit: 3, admissionYearFrom: 2018 },
    { id: 7004, name: '디지털논리회로', code: 'CSE2021', category: '전공필수', credit: 3, admissionYearFrom: 2018 },
    { id: 7005, name: '컴퓨터구조원리', code: 'CSE2031', category: '전공선택', credit: 3, admissionYearFrom: 2018 },
    { id: 7006, name: '운영체제', code: 'CSE3011', category: '전공필수', credit: 3, admissionYearFrom: 2018 },
    { id: 7007, name: '컴퓨터네트워크', code: 'CSE3031', category: '전공선택', credit: 3, admissionYearFrom: 2018 },
    { id: 7008, name: '소프트웨어공학원론', code: 'CSE3102', category: '전공필수', credit: 3, admissionYearFrom: 2018 },
  ];

  for (const c of cseCatalogCourses) {
    await prisma.catalogCourse.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, departmentId: cse.id, admissionYearTo: null },
    });
  }

  await prisma.catalogTrackRequirement.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, trackId: 11, catalogCourseId: 7001 },
  });
  await prisma.catalogTrackRequirement.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, trackId: 11, catalogCourseId: 7002 },
  });
  await prisma.catalogTrackRequirement.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, trackId: 11, catalogCourseId: 7008 },
  });

  // eslint-disable-next-line no-console
  console.log(
    '시드 완료: 가톨릭대학교 성심교정 / 컴퓨터정보공학부·경영학과·데이터사이언스 / 심화 전공 트랙 / 컴공 요람 과목 8건 + 트랙조건 3건',
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
