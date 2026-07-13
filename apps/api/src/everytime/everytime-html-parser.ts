import * as cheerio from 'cheerio';

export interface CrawledCourse {
  name: string;
  code: string | null;
  category: string | null;
  credit: number;
}

export interface CrawledSemesterLink {
  label: string;
  url: string;
}

export interface ParsedTimetablePage {
  semesterLabel: string | null;
  courses: CrawledCourse[];
  semesterLinks: CrawledSemesterLink[];
}

// ⚠️ 실제 에브리타임 공유 시간표 페이지(https://everytime.kr/timetable/@코드)의 DOM 구조를
// 이 환경에서는 라이브 URL로 검증할 수 없었다(유효한 공유 코드가 없음). 아래 셀렉터는
// 공개적으로 알려진 에브리타임 마크업 관례를 참고한 최선의 추정치이며, 실제 공유 URL로
// 한 번 크롤링해보고 맞지 않으면 이 파일의 SELECTORS만 고치면 되도록 격리해뒀다.
const SELECTORS = {
  courseItem: '.tablebody .items .item',
  courseName: '.subject',
  courseInfo: '.info',
  semesterLinkList: '.timetable-list li a, #periodList li a',
};

function extractCreditAndCode(infoText: string): { code: string | null; credit: number } {
  const codeMatch = /([A-Z]{2,4}\d{3,4})/.exec(infoText);
  const creditMatch = /(\d+)\s*학점/.exec(infoText);
  return {
    code: codeMatch ? codeMatch[1] : null,
    credit: creditMatch ? Number(creditMatch[1]) : 0,
  };
}

export function parseTimetableHtml(html: string, baseUrl: string): ParsedTimetablePage {
  const $ = cheerio.load(html);

  const courses: CrawledCourse[] = [];
  $(SELECTORS.courseItem).each((_, el) => {
    const name = $(el).find(SELECTORS.courseName).first().text().trim();
    const infoText = $(el).find(SELECTORS.courseInfo).text().trim();
    if (!name) return;
    const { code, credit } = extractCreditAndCode(infoText);
    // 같은 과목이 요일이 다른 여러 시간 블록으로 나뉘어 렌더링되는 경우가 있어 이름 기준 중복 제거
    if (courses.some((c) => c.name === name)) return;
    courses.push({ name, code, category: null, credit });
  });

  const semesterLinks: CrawledSemesterLink[] = [];
  $(SELECTORS.semesterLinkList).each((_, el) => {
    const href = $(el).attr('href');
    const label = $(el).text().trim();
    if (!href || !label) return;
    const url = new URL(href, baseUrl).toString();
    if (!semesterLinks.some((l) => l.url === url)) {
      semesterLinks.push({ label, url });
    }
  });

  const semesterLabel = $('title').text().trim() || null;

  return { semesterLabel, courses, semesterLinks };
}
