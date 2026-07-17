import * as cheerio from 'cheerio';

export interface CrawledCourse {
  name: string;
  code: string | null;
  category: string | null;
  credit: number;
  professor: string | null;
  // Self-Making Job Portfolio, 생애진로와커리어디자인처럼 정해진 요일/교시 없이 듣는 온라인 강의 —
  // 그리드(.tablebody)가 아니라 별도 목록(.nontimes)에 렌더링된다(사용자 제보 HTML로 확인, 이슈 #53).
  isOnline: boolean;
  // 공유대학(타 대학 학점교류) 과목은 강의실 칸에 "공유대학"이 그대로 찍혀 나온다(사용자 제보 HTML로
  // 확인) — 요람에 없어 매칭 실패할 게 뻔하니 검증 화면에서 바로 원인을 알려줄 수 있게 표시해둔다.
  isSharedUniversity: boolean;
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
  classroom: 'p span',
  // 분반/요일·교시가 없는 온라인 강의 목록 — 과목명만 span.name으로 렌더링된다(교수/강의실 정보 없음).
  onlineCourseItem: '.nontimes .subject',
  onlineCourseName: '.name',
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
    const classroom = $(el).find(SELECTORS.classroom).first().text().trim();
    courses.push({ name, code: null, category: null, credit: 0, professor, isOnline: false, isSharedUniversity: classroom === '공유대학' });
  });

  // 분반 상관없이(요일/교시 그리드에 안 잡히는) 온라인 강의도 항상 크롤링해서 반영한다(사용자 확인).
  $(SELECTORS.onlineCourseItem).each((_, el) => {
    const name = $(el).find(SELECTORS.onlineCourseName).first().text().trim();
    if (!name) return;
    if (courses.some((c) => c.name === name)) return;
    courses.push({ name, code: null, category: null, credit: 0, professor: null, isOnline: true, isSharedUniversity: false });
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
