import * as cheerio from 'cheerio';

// 학사정보(academic.do) 본문에 졸업요건이 없는 학과의 폴백 경로(패턴 ⑩⑫⑰) — 공지사항 게시판 목록에서
// 제목에 졸업요건 관련 키워드가 들어간 가장 최근 게시물을 찾는다. 이 CMS의 검색 쿼리 파라미터 문법이
// 확인되지 않았으므로 ?keyword= 같은 검색 엔드포인트를 추측해서 쓰지 않고, 목록 페이지(1페이지만)를
// 그대로 파싱해 제목을 클라이언트 사이드에서 필터링한다.
export interface NoticeBoardPost {
  articleNo: string;
  title: string;
  detailUrl: string;
}

const GRADUATION_KEYWORDS = ['졸업요건', '졸업시험', '졸업논문', '졸업인증'];

export function parseNoticeBoardListing(html: string, listingUrl: string): NoticeBoardPost[] {
  const $ = cheerio.load(html);
  const posts: NoticeBoardPost[] = [];
  const seen = new Set<string>();

  $('a[href*="articleNo="]').each((_, el) => {
    const href = $(el).attr('href');
    const title = $(el).text().trim();
    if (!href || !title) return;

    const match = /articleNo=(\d+)/.exec(href);
    if (!match) return;
    const articleNo = match[1];
    if (seen.has(articleNo)) return;
    seen.add(articleNo);

    let detailUrl: string;
    try {
      detailUrl = new URL(href, listingUrl).toString();
    } catch {
      return;
    }
    posts.push({ articleNo, title, detailUrl });
  });

  return posts;
}

export function findGraduationRequirementPost(posts: NoticeBoardPost[]): NoticeBoardPost | null {
  return posts.find((post) => GRADUATION_KEYWORDS.some((keyword) => post.title.includes(keyword))) ?? null;
}

// 첨부파일 다운로드 링크만 찾는다(패턴 ⑰) — 이 프로젝트엔 PDF/HWP 텍스트 추출 라이브러리가 없으므로
// 감지 및 URL 확보까지만 하고, 실제 파일 내용 파싱/OCR은 범위 밖이다.
export function parseAttachmentUrl(html: string, detailUrl: string): string | null {
  const $ = cheerio.load(html);
  let found: string | null = null;

  $('a[href]').each((_, el) => {
    if (found) return;
    const href = $(el).attr('href');
    if (!href) return;
    if (!/download|attachNo/i.test(href) && !/\.(pdf|hwp|hwpx)(\?|$)/i.test(href)) return;

    try {
      found = new URL(href, detailUrl).toString();
    } catch {
      found = null;
    }
  });

  return found;
}
