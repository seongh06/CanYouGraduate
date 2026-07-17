import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { parseCrossMajorCreditWorkbook } from '../src/catalog/catholic-university/cross-major-credit-parser';

const prisma = new PrismaClient();

function parseArg(prefix: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

async function main() {
  const file = parseArg('--file=');
  const universityId = Number(parseArg('--universityId=') ?? '1');

  if (!file) {
    // eslint-disable-next-line no-console
    console.error('사용법: npm run import:cross-major-credits -- --file="엑셀경로.xlsx" [--universityId=1]');
    process.exit(1);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  const rows = parseCrossMajorCreditWorkbook(workbook);

  const departments = await prisma.department.findMany({ where: { universityId }, select: { id: true, name: true } });
  const departmentIdByName = new Map(departments.map((d) => [d.name, d.id]));

  const unmatchedNames = new Set<string>();
  let imported = 0;

  await prisma.crossMajorCreditRecognition.deleteMany({
    where: { recognizingDepartment: { universityId } },
  });

  for (const row of rows) {
    const departmentId = departmentIdByName.get(row.recognizingDepartmentName);
    if (!departmentId) {
      unmatchedNames.add(row.recognizingDepartmentName);
      continue;
    }

    await prisma.crossMajorCreditRecognition.create({
      data: {
        recognizingDepartmentId: departmentId,
        offeringDepartmentName: row.offeringDepartmentName,
        courseName: row.courseName,
        courseCode: row.courseCode,
        note: row.note,
        seriesLabel: row.seriesLabel,
      },
    });
    imported += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`${file}: 총 ${rows.length}행 중 ${imported}건 임포트 완료`);
  if (unmatchedNames.size > 0) {
    // eslint-disable-next-line no-console
    console.log(`학과명 매칭 실패(${unmatchedNames.size}개, DB에 없거나 표기가 다름): ${[...unmatchedNames].join(', ')}`);
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
