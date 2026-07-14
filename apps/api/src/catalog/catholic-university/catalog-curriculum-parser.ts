import * as cheerio from 'cheerio';

export interface CrawledCatalogCourse {
  code: string;
  name: string;
  category: string;
  credit: number;
}

// 가톨릭대 학과 사이트 공통 CMS 템플릿(csie/business/math 등에서 실제 확인됨).
// 표: 과목번호 | 교과목명 | 이수구분 | 학점 | 설명(팝업) — 앞 4개 컬럼만 사용.
const TABLE_SELECTOR = 'table.b-bachelor-curriculum-table';

export function parseCurriculumHtml(html: string): CrawledCatalogCourse[] {
  const $ = cheerio.load(html);
  const courses: CrawledCatalogCourse[] = [];

  $(TABLE_SELECTOR)
    .first()
    .find('tbody tr')
    .each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 4) return;

      const code = $(cells[0]).text().trim();
      const name = $(cells[1]).text().trim();
      const category = $(cells[2]).text().trim();
      const credit = Number($(cells[3]).text().trim());

      if (!code || !name || Number.isNaN(credit)) return;
      courses.push({ code, name, category, credit });
    });

  return courses;
}
