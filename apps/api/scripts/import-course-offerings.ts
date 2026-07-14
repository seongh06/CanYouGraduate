import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { parseCourseOfferingWorkbook } from '../src/catalog/catholic-university/course-offering-xlsx-parser';

const prisma = new PrismaClient();

// 트리니티에서 학기별로 내려받는 파일명 그대로("개설과목리스트_2025_1학기.xlsx") 연도/학기를 추출한다.
const FILENAME_PATTERN = /^개설과목리스트_(\d{4})_(.+)\.xlsx$/;

function parseArg(prefix: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

async function main() {
  const dir = parseArg('--dir=');
  const universityId = Number(parseArg('--universityId=') ?? '1');

  if (!dir) {
    // eslint-disable-next-line no-console
    console.error('사용법: npm run import:offerings -- --dir="폴더경로" [--universityId=1]');
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter((f) => FILENAME_PATTERN.test(f));
  if (files.length === 0) {
    // eslint-disable-next-line no-console
    console.error(`${dir}에서 "개설과목리스트_YYYY_학기.xlsx" 형식 파일을 찾지 못함`);
    process.exit(1);
  }

  for (const file of files) {
    const match = FILENAME_PATTERN.exec(file);
    if (!match) continue;
    const year = Number(match[1]);
    const term = match[2];

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join(dir, file));
    const rows = parseCourseOfferingWorkbook(workbook);

    for (const row of rows) {
      await prisma.courseOffering.upsert({
        where: {
          universityId_year_term_code_section: { universityId, year, term, code: row.code, section: row.section },
        },
        update: {
          name: row.name,
          category: row.category,
          credit: row.credit,
          professor: row.professor,
          departmentName: row.departmentName,
        },
        create: {
          universityId,
          year,
          term,
          code: row.code,
          name: row.name,
          section: row.section,
          category: row.category,
          credit: row.credit,
          professor: row.professor,
          departmentName: row.departmentName,
        },
      });
    }

    // eslint-disable-next-line no-console
    console.log(`${file}: ${rows.length}건 임포트 완료 (${year}년 ${term})`);
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
