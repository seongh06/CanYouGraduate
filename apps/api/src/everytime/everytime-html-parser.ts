import * as cheerio from 'cheerio';

export interface CrawledCourse {
  name: string;
  code: string | null;
  category: string | null;
  credit: number;
  professor: string | null;
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

// 실제 공유 시간표 페이지(https://everytime.kr/@코드, "친구 시간표 보기")를 Playwright로
// 렌더링해 확인한 DOM 구조 기준. 이 페이지엔 과목코드/학점 정보가 아예 없어서(교수/강의실만
// 표시됨) code/credit은 항상 null/0으로 남고, 이후 needsSubstitution 플로우로 사용자가
// 직접 요람 과목과 매칭한다.
const SELECTORS = {
  courseItem: '.tablebody .subject',
  courseName: 'h3',
  courseInfo: 'p',
  professor: 'p em',
  semesterLinkList: 'aside .menu ol li a',
  activeSemesterLabel: 'aside .menu ol li.active a',
};

export function parseTimetableHtml(html: string, baseUrl: string): ParsedTimetablePage {
  const $ = cheerio.load(html);

  const courses: CrawledCourse[] = [];
  $(SELECTORS.courseItem).each((_, el) => {
    const name = $(el).find(SELECTORS.courseName).first().text().trim();
    // 커스텀 일정(이모지 제목 등)은 교수/강의실이 항상 비어 있어 실제 과목과 구분됨
    const infoText = $(el).find(SELECTORS.courseInfo).text().trim();
    if (!name || !infoText) return;
    // 같은 과목이 요일이 다른 여러 시간 블록으로 나뉘어 렌더링되는 경우가 있어 이름 기준 중복 제거
    if (courses.some((c) => c.name === name)) return;
    const professor = $(el).find(SELECTORS.professor).first().text().trim() || null;
    courses.push({ name, code: null, category: null, credit: 0, professor });
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

  const semesterLabel = $(SELECTORS.activeSemesterLabel).first().text().trim() || null;

  return { semesterLabel, courses, semesterLinks };
}
