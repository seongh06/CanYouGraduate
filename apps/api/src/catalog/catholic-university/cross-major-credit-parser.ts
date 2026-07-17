import type { Workbook } from 'exceljs';

export interface ParsedCrossMajorCreditRow {
  seriesLabel: string | null;
  recognizingDepartmentName: string;
  offeringDepartmentName: string;
  courseName: string;
  courseCode: string;
  note: string | null;
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  let text: string;
  if (typeof value === 'object' && 'richText' in (value as Record<string, unknown>)) {
    text = ((value as { richText: Array<{ text: string }> }).richText).map((r) => r.text).join('');
  } else {
    text = String(value);
  }
  // 줄바꿈은 셀 폭에 맞춘 단순 줄바꿈(예: "미디어기술\n콘텐츠학과" = "미디어기술콘텐츠학과")이라
  // 공백 없이 이어붙인다. "∙"(U+2219)는 학과명 DB의 "·"(U+00B7, 가운뎃점)와 다른 문자라 정규화한다.
  return text.replace(/\r?\n/g, '').replace(/∙/g, '·').trim();
}

// "국제경영학과 (글로벌미래 경영학과)"처럼 인정학과 셀에 괄호로 부가설명이 붙은 경우, 실제 학과명과
// 분리해서 괄호 안 텍스트는 note로 옮긴다 — 그대로 두면 Department.name 매칭이 실패한다.
function splitDepartmentQualifier(raw: string): { name: string; qualifier: string | null } {
  const match = /^(.+?)\s*\(([^)]+)\)$/.exec(raw);
  if (!match) return { name: raw, qualifier: null };
  return { name: match[1].trim(), qualifier: match[2].trim() };
}

// "타전공_학점인정_교과목_목록(2026.06).xlsx" — 시트마다 계열(B)·인정학과(C)·개설학과(D) 열이
// 그룹 첫 행에만 값이 있고(엑셀 병합 셀을 언바인딩하면 나머지 행은 빈칸) 나머지 행은 위 값을
// 그대로 물려받는 forward-fill 구조. 교과목명(E)·교과목코드(F)가 있는 행만 실제 데이터 행이고,
// "-"만 있는 행(해당 학과에 인정 과목 없음)과 헤더/제목 행은 건너뛴다.
export function parseCrossMajorCreditWorkbook(workbook: Workbook): ParsedCrossMajorCreditRow[] {
  const rows: ParsedCrossMajorCreditRow[] = [];

  for (const worksheet of workbook.worksheets) {
    let series: string | null = null;
    let recognizingDept: string | null = null;
    let offeringDept: string | null = null;

    worksheet.eachRow((row, rowNumber) => {
      // 1행 공백, 2행 제목(전체 병합이라 모든 열이 같은 텍스트를 반환), 3행 공백, 4행 헤더 —
      // 8개 시트 전부 동일한 구조(원본 파일 직접 확인). 5행부터 실제 데이터.
      if (rowNumber < 5) return;

      const seriesCell = cellText(row.getCell(2).value);
      const recognizingCell = cellText(row.getCell(3).value);
      const offeringCell = cellText(row.getCell(4).value);
      const courseName = cellText(row.getCell(5).value);
      const courseCode = cellText(row.getCell(6).value);
      const note = cellText(row.getCell(7).value) || null;

      let qualifier: string | null = null;
      if (recognizingCell) {
        const split = splitDepartmentQualifier(recognizingCell);
        recognizingDept = split.name;
        qualifier = split.qualifier;
      }
      if (seriesCell) series = seriesCell;
      if (offeringCell) offeringDept = offeringCell;

      if (!courseName || !courseCode || courseName === '-' || courseCode === '-') return;
      if (!recognizingDept || !offeringDept) return;

      rows.push({
        seriesLabel: series && series !== '-' ? series : null,
        recognizingDepartmentName: recognizingDept,
        offeringDepartmentName: offeringDept,
        courseName,
        courseCode,
        note: qualifier ? [note, `인정조건: ${qualifier}`].filter(Boolean).join('; ') : note,
      });
    });
  }

  return rows;
}
