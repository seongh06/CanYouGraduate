import type { Workbook } from 'exceljs';

export interface ParsedTrackCourseRecognitionRow {
  offeringDepartmentName: string | null;
  courseCode: string | null;
  courseName: string;
  trackName: string;
  area: string;
  note: string | null;
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  let text: string;
  if (typeof value === 'object' && 'richText' in (value as Record<string, unknown>)) {
    text = (value as { richText: Array<{ text: string }> }).richText.map((r) => r.text).join('');
  } else {
    text = String(value);
  }
  return text.replace(/\r?\n/g, '').replace(/∙/g, '·').trim();
}

// "트랙별_전공인정과목.xlsx"의 학과 시트는 1~3행이 트랙명/세부영역명/영역별 최소이수학점 병합
// 헤더고 4행부터 과목별 데이터다. exceljs는 병합 셀에서 top-left가 아닌 칸을 읽으면 null을 주기
// 때문에 헤더를 셀 값으로 동적 판정하지 않고, 이 시트가 고정된 열 구조라는 점을 이용해
// 열 위치 → (트랙명, 영역명) 매핑을 그대로 하드코딩한다(미디어기술콘텐츠학과 시트 기준: F~L열).
// "트랙미이수"(E열)는 인정 과목이 사실상 학과 전공선택/필수 전체와 같아 기존 category 기반 계산과
// 다르지 않으므로 이 테이블로 옮기지 않는다 — 트랙을 고르지 않은 학생(default)은 기존 로직 그대로 계산된다.
const COLUMN_AREAS: Array<{ column: number; trackName: string; area: string }> = [
  { column: 6, trackName: '문화콘텐츠트랙', area: '기획창작영역' },
  { column: 7, trackName: '문화콘텐츠트랙', area: '콘텐츠비즈니스영역' },
  { column: 8, trackName: '미디어공학트랙', area: '기초영역' },
  { column: 9, trackName: '미디어공학트랙', area: '필수영역' },
  { column: 10, trackName: '미디어공학트랙', area: '응용영역' },
  { column: 11, trackName: '테크니컬아티스트트랙', area: '기획창작영역' },
  { column: 12, trackName: '테크니컬아티스트트랙', area: '콘텐츠비즈니스영역' },
];

export function parseTrackCourseRecognitionSheet(workbook: Workbook, sheetName: string): ParsedTrackCourseRecognitionRow[] {
  const worksheet = workbook.getWorksheet(sheetName);
  if (!worksheet) return [];

  const rows: ParsedTrackCourseRecognitionRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < 4) return; // 1~3행: 트랙명/영역명/최소학점 헤더

    const offeringRaw = cellText(row.getCell(1).value);
    const courseCode = cellText(row.getCell(2).value);
    const courseName = cellText(row.getCell(3).value);
    const note = cellText(row.getCell(13).value) || null;

    // "확인필요" placeholder 행(과목코드를 못 찾아 과목명 칸에도 코드 숫자를 그대로 채워둠)은
    // 이름 기반 매칭에 쓸 수 없어 건너뛴다 — 원본 xlsx에서 실제 과목명이 채워지면 재수입한다.
    if (!courseName || courseName === courseCode) return;

    const offeringDepartmentName = offeringRaw && offeringRaw !== '확인필요' ? offeringRaw : null;

    for (const { column, trackName, area } of COLUMN_AREAS) {
      const recognized = cellText(row.getCell(column).value);
      if (!recognized) continue;
      rows.push({
        offeringDepartmentName,
        courseCode: courseCode || null,
        courseName,
        trackName,
        area,
        note,
      });
    }
  });

  return rows;
}
