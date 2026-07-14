import { Prisma, PrismaClient } from '@prisma/client';
import { CatalogCrawlerService } from '../src/catalog/catholic-university/catalog-crawler.service';

const prisma = new PrismaClient();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const crawler = new CatalogCrawlerService();
  // other-campus(성의/성신교정)는 기존 요람 크롤러와 동일하게 자동 크롤링 대상에서 제외.
  const departments = await prisma.department.findMany({
    where: { domainSlug: { not: null }, baseUrl: { not: null }, urlPattern: { not: 'other-campus' } },
  });

  let success = 0;
  let failed = 0;

  for (const dept of departments) {
    if (!dept.baseUrl || !dept.domainSlug) continue;

    try {
      const parsed = await crawler.crawlAcademicRequirement({
        domainSlug: dept.domainSlug,
        baseUrl: dept.baseUrl,
        urlPattern: dept.urlPattern,
      });

      await prisma.catalogGraduationRequirement.upsert({
        where: {
          departmentId_admissionYearFrom: { departmentId: dept.id, admissionYearFrom: parsed.admissionYearFrom ?? 2018 },
        },
        update: {
          totalCreditMin: parsed.totalCreditMin,
          creditBreakdown: parsed.creditBreakdown ?? Prisma.JsonNull,
          comprehensiveExam: parsed.comprehensiveExam ?? Prisma.JsonNull,
          substitutionRules: parsed.substitutionRules,
        },
        create: {
          departmentId: dept.id,
          admissionYearFrom: parsed.admissionYearFrom ?? 2018,
          totalCreditMin: parsed.totalCreditMin,
          creditBreakdown: parsed.creditBreakdown ?? Prisma.JsonNull,
          comprehensiveExam: parsed.comprehensiveExam ?? Prisma.JsonNull,
          substitutionRules: parsed.substitutionRules,
        },
      });

      success += 1;
      // eslint-disable-next-line no-console
      console.log(`${dept.name}(${dept.domainSlug}): totalCreditMin=${parsed.totalCreditMin}, creditBreakdown 키 ${Object.keys(parsed.creditBreakdown ?? {}).length}개`);
    } catch (error) {
      failed += 1;
      // eslint-disable-next-line no-console
      console.warn(`${dept.name}(${dept.domainSlug}) 크롤링 실패: ${(error as Error).message}`);
    }

    await sleep(1500 + Math.random() * 1000);
  }

  // eslint-disable-next-line no-console
  console.log(`\n완료: 성공 ${success}건, 실패 ${failed}건 (총 ${departments.length}개 학과)`);
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
