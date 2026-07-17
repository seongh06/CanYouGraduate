import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { parseTrackCourseRecognitionSheet } from '../src/catalog/catholic-university/track-course-recognition-parser';

const prisma = new PrismaClient();

function parseArg(prefix: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

async function main() {
  const file = parseArg('--file=');
  const departmentName = parseArg('--department=') ?? '미디어기술콘텐츠학과';
  const sheetName = parseArg('--sheet=') ?? departmentName;

  if (!file) {
    // eslint-disable-next-line no-console
    console.error(
      '사용법: npm run import:track-course-recognition -- --file="트랙별_전공인정과목.xlsx" [--department="학과명"] [--sheet="시트명"]',
    );
    process.exit(1);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  const rows = parseTrackCourseRecognitionSheet(workbook, sheetName);

  const department = await prisma.department.findFirst({ where: { name: departmentName } });
  if (!department) {
    // eslint-disable-next-line no-console
    console.error(`학과를 찾지 못함: ${departmentName}`);
    process.exit(1);
  }

  const tracks = await prisma.track.findMany({ where: { departmentId: department.id } });
  const trackIdByName = new Map(tracks.map((t) => [t.name, t.id]));

  await prisma.trackCourseRecognition.deleteMany({ where: { departmentId: department.id } });

  const unmatchedTracks = new Set<string>();
  let imported = 0;

  for (const row of rows) {
    const trackId = trackIdByName.get(row.trackName);
    if (!trackId) {
      unmatchedTracks.add(row.trackName);
      continue;
    }

    await prisma.trackCourseRecognition.create({
      data: {
        departmentId: department.id,
        trackId,
        offeringDepartmentName: row.offeringDepartmentName,
        courseCode: row.courseCode,
        courseName: row.courseName,
        area: row.area,
        note: row.note,
      },
    });
    imported += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`${file} [${sheetName}]: 총 ${rows.length}행 중 ${imported}건 임포트 완료`);
  if (unmatchedTracks.size > 0) {
    // eslint-disable-next-line no-console
    console.log(`트랙명 매칭 실패(Track 테이블에 없거나 표기가 다름): ${[...unmatchedTracks].join(', ')}`);
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
