import { PrismaClient } from '@prisma/client';
import { CatalogCrawlerService } from '../src/catalog/catholic-university/catalog-crawler.service';

const prisma = new PrismaClient();

function parseDeptArg(): string[] {
  const arg = process.argv.find((a) => a.startsWith('--dept='));
  if (!arg) return [];
  return arg
    .replace('--dept=', '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const slugs = parseDeptArg();
  if (slugs.length === 0) {
    // eslint-disable-next-line no-console
    console.error('사용법: npm run crawl:catalog -- --dept=csie,business,math');
    process.exit(1);
  }

  const crawler = new CatalogCrawlerService();
  const departments = await prisma.department.findMany({ where: { domainSlug: { in: slugs } } });

  for (const dept of departments) {
    if (!dept.baseUrl || !dept.domainSlug) {
      // eslint-disable-next-line no-console
      console.warn(`스킵: ${dept.name} — baseUrl/domainSlug 없음`);
      continue;
    }

    try {
      const courses = await crawler.crawlDepartment({
        domainSlug: dept.domainSlug,
        baseUrl: dept.baseUrl,
        urlPattern: dept.urlPattern,
      });

      for (const c of courses) {
        await prisma.catalogCourse.upsert({
          where: { departmentId_code: { departmentId: dept.id, code: c.code } },
          update: { name: c.name, category: c.category, credit: c.credit },
          create: {
            departmentId: dept.id,
            code: c.code,
            name: c.name,
            category: c.category,
            credit: c.credit,
            admissionYearFrom: 2018,
          },
        });
      }

      // eslint-disable-next-line no-console
      console.log(`${dept.name}(${dept.domainSlug}): ${courses.length}개 과목 수집 완료`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`${dept.name}(${dept.domainSlug}) 크롤링 실패: ${(error as Error).message}`);
    }

    await sleep(3000 + Math.random() * 2000);
  }
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
