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

  // eslint-disable-next-line no-console
  console.log('시드 완료: 가톨릭대학교 성심교정 / 컴퓨터정보공학부·경영학과·데이터사이언스 / 심화 전공 트랙');
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
