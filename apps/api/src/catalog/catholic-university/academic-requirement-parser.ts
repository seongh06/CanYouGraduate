import * as cheerio from 'cheerio';
import type { Cheerio, CheerioAPI } from 'cheerio';
import type { Element } from 'domhandler';

export interface ParsedAcademicRequirement {
  admissionYearFrom: number | null;
  totalCreditMin: number | null;
  creditBreakdown: Record<string, number> | null;
  comprehensiveExam: { majorRequiredCount: number | null; doubleMajorRequiredCount: number | null } | null;
  substitutionRules: Array<{ type: string; condition: string; waives: number | null }>;
}

function findTableByCaption($: CheerioAPI, captionIncludes: string): Cheerio<Element> | null {
  const tables = $('table.cuk-table').filter((_, table) => $(table).find('caption').first().text().includes(captionIncludes));
  return tables.length > 0 ? tables.first() : null;
}

function parseFirstNumber(text: string): number | null {
  const match = /(\d+)/.exec(text);
  return match ? Number(match[1]) : null;
}

function rowCells($: CheerioAPI, row: Element, cellTag: 'th' | 'td'): string[] {
  const cells: string[] = [];
  $(row)
    .find(cellTag)
    .each((_, cell) => {
      cells.push($(cell).text().trim());
    });
  return cells;
}

// rowspan=2인 1행 헤더 th는 데이터 컬럼 하나를 단독으로 차지하고, rowspan 없는(=colspan) 1행 헤더는
// 그 colspan 수만큼 2행 헤더에서 순서대로 가져와 리프 헤더를 재구성한다 — position 계산 대신 실제
// rowspan/colspan 속성을 읽어야 학과마다 표 구조가 조금씩 달라도 안전하게 정렬된다.
function buildLeafHeaders($: CheerioAPI, table: Cheerio<Element>): string[] {
  const headerRows = table.find('thead tr');
  if (headerRows.length === 0) return [];
  if (headerRows.length === 1) return rowCells($, headerRows.get(0)!, 'th');

  const row1 = headerRows.get(0)!;
  const row2Queue = rowCells($, headerRows.get(1)!, 'th');
  const leaves: string[] = [];

  $(row1)
    .find('th')
    .each((_, th) => {
      const rowspan = Number($(th).attr('rowspan') ?? '1');
      const colspan = Number($(th).attr('colspan') ?? '1');
      if (rowspan > 1) {
        leaves.push($(th).text().trim());
      } else {
        for (let i = 0; i < colspan; i += 1) {
          leaves.push(row2Queue.shift() ?? '');
        }
      }
    });

  return leaves;
}

function parseCreditTable(
  $: CheerioAPI,
  table: Cheerio<Element>,
): { totalCreditMin: number | null; creditBreakdown: Record<string, number> | null } {
  const headers = buildLeafHeaders($, table);
  const firstDataRow = table.find('tbody tr').get(0);
  if (!firstDataRow) return { totalCreditMin: null, creditBreakdown: null };
  const cells = rowCells($, firstDataRow, 'td');
  if (cells.length === 0) return { totalCreditMin: null, creditBreakdown: null };

  const totalCreditMin = parseFirstNumber(cells[cells.length - 1]);

  const breakdown: Record<string, number> = {};
  headers.forEach((h, i) => {
    if (!h || i >= cells.length) return;
    // "학부"/"학부(과)" 같은 행 라벨 컬럼, 졸업 최저이수학점(이미 totalCreditMin으로 뽑음) 컬럼은 제외
    if (h.includes('학부') || (h.includes('졸업') && h.includes('최저'))) return;
    const num = parseFirstNumber(cells[i]);
    if (num !== null) breakdown[h] = num;
  });

  return { totalCreditMin, creditBreakdown: Object.keys(breakdown).length > 0 ? breakdown : null };
}

// "졸업성적유형" 표: 유형(종합시험) 행에서 심화전공/복수전공(또는 타 계열 복수전공) 컬럼의 과목 수.
// "유형" 컬럼은 rowspan이라 2행 헤더엔 없지만 값 행엔 라벨로 남아있어 뒤에서부터 정렬한다.
function parseComprehensiveExamTable(
  $: CheerioAPI,
  table: Cheerio<Element>,
): { majorRequiredCount: number | null; doubleMajorRequiredCount: number | null } | null {
  const headerRows = table.find('thead tr');
  const headers = headerRows.length > 1 ? rowCells($, headerRows.get(1)!, 'th') : rowCells($, headerRows.get(0)!, 'th');

  let majorRequiredCount: number | null = null;
  let doubleMajorRequiredCount: number | null = null;

  table.find('tbody tr').each((_, row) => {
    const cells = rowCells($, row, 'td');
    if (cells[0] !== '종합시험') return;
    const dataCells = cells.slice(cells.length - headers.length);

    headers.forEach((h, i) => {
      const num = parseFirstNumber(dataCells[i] ?? '');
      if (num === null) return;
      if (h.includes('심화')) majorRequiredCount = num;
      if (h.includes('복수')) doubleMajorRequiredCount = num;
    });
  });

  if (majorRequiredCount === null && doubleMajorRequiredCount === null) return null;
  return { majorRequiredCount, doubleMajorRequiredCount };
}

// 영어 시험 점수 기준표: 각 행이 "TOEIC 점수대별 대체 과목 수" 형태 — TOEIC 컬럼(가장 흔한 기준)과
// 마지막 컬럼(대체 과목 수)만 뽑아 substitutionRules로 변환한다.
function parseSubstitutionTable(
  $: CheerioAPI,
  table: Cheerio<Element>,
): Array<{ type: string; condition: string; waives: number | null }> {
  const headers = buildLeafHeaders($, table);
  const toeicIdx = headers.findIndex((h) => h === 'TOEIC');
  const waivesIdx = headers.findIndex((h) => h.includes('대체') && h.includes('과목'));
  if (toeicIdx === -1 || waivesIdx === -1) return [];

  const rules: Array<{ type: string; condition: string; waives: number | null }> = [];
  table.find('tbody tr').each((_, row) => {
    const cells = rowCells($, row, 'td');
    const condition = cells[toeicIdx];
    const waives = parseFirstNumber(cells[waivesIdx] ?? '');
    if (!condition) return;
    rules.push({ type: 'TOEIC', condition, waives });
  });
  return rules;
}

// "2018학년도 입학자 기준 적용 이수학점 기준표" 같은 h5 제목에서 적용 기준 학번을 뽑는다.
function findAdmissionYearFrom($: CheerioAPI): number | null {
  let year: number | null = null;
  $('h5.h5-tit01').each((_, h5) => {
    const match = /(\d{4})학년도/.exec($(h5).text());
    if (match) year = Number(match[1]);
  });
  return year;
}

export function parseAcademicRequirementHtml(html: string): ParsedAcademicRequirement {
  const $ = cheerio.load(html);

  const admissionYearFrom = findAdmissionYearFrom($);
  const creditTable = findTableByCaption($, '졸업 최저 이수 학점표');
  const { totalCreditMin, creditBreakdown } = creditTable
    ? parseCreditTable($, creditTable)
    : { totalCreditMin: null, creditBreakdown: null };

  const examTable = findTableByCaption($, '졸업성적유형');
  const comprehensiveExam = examTable ? parseComprehensiveExamTable($, examTable) : null;

  const substitutionTable = findTableByCaption($, '영어 시험 점수 기준표') ?? findTableByCaption($, '영어 시험(점수 기준표)');
  const substitutionRules = substitutionTable ? parseSubstitutionTable($, substitutionTable) : [];

  return { admissionYearFrom, totalCreditMin, creditBreakdown, comprehensiveExam, substitutionRules };
}
