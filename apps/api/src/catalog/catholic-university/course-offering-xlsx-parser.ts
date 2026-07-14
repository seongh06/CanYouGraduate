import type { Workbook } from 'exceljs';

export interface ParsedCourseOffering {
  category: string;
  departmentName: string;
  code: string;
  name: string;
  section: string;
  credit: number;
  professor: string;
}

// 트리니티(uportal) "개설과목리스트" 엑셀의 고정 컬럼 순서(실제 파일로 확인, 1행 제목/2행 헤더):
// 1전공기준 이수구분 | 개설전공(과) | 과목번호 | 교과목명 | 분반 | 이수학년 | 시간/학점 | 수강인원 | 담당교수 | 요일및교시(강의실) | 외국어 강의여부 | 비고
export function parseCourseOfferingWorkbook(workbook: Workbook): ParsedCourseOffering[] {
  const worksheet = workbook.worksheets[0];
  const rows: ParsedCourseOffering[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < 3) return;

    const cell = (col: number) => String(row.getCell(col).value ?? '').trim();

    const category = cell(1);
    const departmentName = cell(2);
    const code = cell(3);
    const name = cell(4);
    const section = cell(5);
    const hoursOverCredit = cell(7); // "4/3"(시간/학점) 형식 — 뒤쪽 숫자가 학점
    const professor = cell(9);

    if (!code || !name) return;

    const creditMatch = /\/(\d+)$/.exec(hoursOverCredit);
    const credit = creditMatch ? Number(creditMatch[1]) : Number(hoursOverCredit) || 0;

    rows.push({ category, departmentName, code, name, section, credit, professor });
  });

  return rows;
}
