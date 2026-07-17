import { Prisma, PrismaClient } from '@prisma/client';
import { CatalogCrawlerService } from '../src/catalog/catholic-university/catalog-crawler.service';

const prisma = new PrismaClient();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const crawler = new CatalogCrawlerService();
  // other-campus(성의/성신교정)와 행정단위(자유전공학부 등, 패턴 ⑱)는 자동 크롤링 대상에서 제외.
  const departments = await prisma.department.findMany({
    where: {
      domainSlug: { not: null },
      baseUrl: { not: null },
      urlPattern: { not: 'other-campus' },
      isAdministrativeUnit: false,
    },
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
        academicRequirementUrl: dept.academicRequirementUrl,
      });

      // 이 스크립트는 트랙/학번군이 분리된 시드 데이터를 세밀하게 갱신하지 않는다 — 트랙이 없는
      // 학과의 "대표 행"(trackId: null)만 자동 재크롤링 대상으로 삼고, 트랙별/학번군별로 갈리는
      // 세부 데이터는 seed.ts의 수동 조사 데이터를 그대로 신뢰한다(덮어쓰지 않는다).
      const existing = await prisma.catalogGraduationRequirement.findFirst({
        where: { departmentId: dept.id, trackId: null },
        orderBy: { id: 'asc' },
      });

      const data = {
        totalCreditMin: parsed.totalCreditMin,
        creditBreakdown: parsed.creditBreakdown ?? Prisma.JsonNull,
        comprehensiveExam: parsed.comprehensiveExam ?? Prisma.JsonNull,
        substitutionRules: parsed.substitutionRules,
        admissionYearFrom: parsed.admissionYearFrom ?? undefined,
        dataSource: parsed.dataSource === 'NOTICE_ATTACHMENT' ? ('NOTICE_ATTACHMENT' as const) : ('PAGE_DIRECT' as const),
        attachmentUrl: parsed.attachmentUrl ?? null,
      };

      if (existing) {
        await prisma.catalogGraduationRequirement.update({ where: { id: existing.id }, data });
      } else {
        await prisma.catalogGraduationRequirement.create({
          data: { departmentId: dept.id, cohortLabel: '자동 크롤링(학번군 미분류)', ...data },
        });
      }

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
