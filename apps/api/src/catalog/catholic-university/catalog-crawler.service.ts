import { Injectable, Logger } from '@nestjs/common';
import { ParsedAcademicRequirement, parseAcademicRequirementHtml } from './academic-requirement-parser';
import { CrawledCatalogCourse, parseCurriculumHtml } from './catalog-curriculum-parser';
import { findGraduationRequirementPost, parseAttachmentUrl, parseNoticeBoardListing } from './notice-board-parser';

export class CatalogCrawlFailedError extends Error {}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

export interface CrawlableDepartment {
  domainSlug: string;
  baseUrl: string;
  urlPattern: string;
  // 학사정보 페이지가 표준 course/academic.do 경로가 아닌 학과용 override(패턴 ⑦, Department.academicRequirementUrl).
  academicRequirementUrl?: string | null;
}

@Injectable()
export class CatalogCrawlerService {
  private readonly logger = new Logger(CatalogCrawlerService.name);

  async crawlDepartment(department: CrawlableDepartment): Promise<CrawledCatalogCourse[]> {
    switch (department.urlPattern) {
      case 'other-campus':
        this.logger.warn(`성의/성신교정 학과는 자동 크롤링 대상이 아닙니다: ${department.domainSlug}`);
        return [];
      case 'subdirectory':
        // baseUrl이 이미 www.catholic.ac.kr/{slug}/index.do 형태 — course/curriculum.do 하위 경로 존재 여부가
        // 개별 검증되지 않았으므로 실패 시 그대로 에러를 던져 호출부(스크립트)에서 스킵 처리하도록 한다.
        return this.fetchCurriculum(`${department.baseUrl.replace(/\/index\.do$/, '')}/course/curriculum.do`);
      case 'standard':
      default:
        return this.fetchCurriculum(`${department.baseUrl}/${department.domainSlug}/course/curriculum.do`);
    }
  }

  private async fetchCurriculum(url: string): Promise<CrawledCatalogCourse[]> {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } }).catch(() => null);
    if (!response || !response.ok) {
      throw new CatalogCrawlFailedError(`커리큘럼 페이지에 접근할 수 없습니다: ${url}`);
    }

    const html = await response.text();
    const courses = parseCurriculumHtml(html);
    if (courses.length === 0) {
      throw new CatalogCrawlFailedError(`커리큘럼 표를 찾을 수 없습니다: ${url}`);
    }

    return courses;
  }

  // 학사정보(academic.do) — 졸업요건(총학점/학점구성/종합시험/영어 대체규정). curriculum.do와 URL
  // 패턴이 동일해 urlPattern 분기 로직을 그대로 재사용한다. academicRequirementUrl override가 있으면
  // (패턴 ⑦: 슬러그가 academic.do가 아닌 학과) urlPattern 분기 없이 그 URL을 그대로 사용한다.
  async crawlAcademicRequirement(department: CrawlableDepartment): Promise<ParsedAcademicRequirement> {
    if (department.urlPattern === 'other-campus') {
      throw new CatalogCrawlFailedError(`성의/성신교정 학과는 자동 크롤링 대상이 아닙니다: ${department.domainSlug}`);
    }

    if (department.academicRequirementUrl) {
      return this.fetchAcademicRequirement(department.academicRequirementUrl, department.baseUrl, department.domainSlug);
    }

    switch (department.urlPattern) {
      case 'subdirectory':
        return this.fetchAcademicRequirement(
          `${department.baseUrl.replace(/\/index\.do$/, '')}/course/academic.do`,
          department.baseUrl,
          department.domainSlug,
        );
      case 'standard':
      default:
        return this.fetchAcademicRequirement(
          `${department.baseUrl}/${department.domainSlug}/course/academic.do`,
          department.baseUrl,
          department.domainSlug,
        );
    }
  }

  private async fetchAcademicRequirement(url: string, baseUrl: string, domainSlug: string): Promise<ParsedAcademicRequirement> {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } }).catch(() => null);
    if (!response || !response.ok) {
      throw new CatalogCrawlFailedError(`학사정보 페이지에 접근할 수 없습니다: ${url}`);
    }

    const html = await response.text();
    const parsed = parseAcademicRequirementHtml(html);
    if (parsed.totalCreditMin === null && parsed.creditBreakdown === null && parsed.comprehensiveExam === null) {
      const fallback = await this.fetchAcademicRequirementFromNoticeBoard(baseUrl, domainSlug);
      if (fallback) return fallback;
      throw new CatalogCrawlFailedError(`학사정보 표를 찾을 수 없습니다: ${url}`);
    }

    return { ...parsed, dataSource: 'PAGE_DIRECT' };
  }

  // 사회복지학과/음악과처럼 academic.do 본문에 졸업요건 자체가 없거나(패턴 ⑩), 정보통신전자공학부
  // 신제도처럼 졸업시점 기준 개편이 공지사항에만 게시된 경우(패턴 ⑫)의 폴백. 게시판 목록 1페이지만
  // 훑어 제목에 졸업요건 관련 키워드가 있는 가장 최근 글을 찾고, 본문에서 바로 파싱이 안 되면
  // 첨부파일 링크 존재 여부만 확인한다(파일 다운로드/텍스트 추출은 하지 않음 — 패턴 ⑰, PDF/HWP
  // 파서가 아직 이 프로젝트에 없다). 목록 페칭 1회 + 상세 페칭 최대 1회로 끝내고, 페이지네이션은 하지 않는다.
  private async fetchAcademicRequirementFromNoticeBoard(
    baseUrl: string,
    domainSlug: string,
  ): Promise<ParsedAcademicRequirement | null> {
    const listingUrl = `${baseUrl}/${domainSlug}/community/notice.do`;
    const listingResponse = await fetch(listingUrl, { headers: { 'User-Agent': USER_AGENT } }).catch(() => null);
    if (!listingResponse || !listingResponse.ok) return null;

    const posts = parseNoticeBoardListing(await listingResponse.text(), listingUrl);
    const matched = findGraduationRequirementPost(posts);
    if (!matched) return null;

    const detailResponse = await fetch(matched.detailUrl, { headers: { 'User-Agent': USER_AGENT } }).catch(() => null);
    if (!detailResponse || !detailResponse.ok) return null;

    const detailHtml = await detailResponse.text();
    const parsedFromPost = parseAcademicRequirementHtml(detailHtml);
    if (parsedFromPost.totalCreditMin !== null || parsedFromPost.creditBreakdown !== null || parsedFromPost.comprehensiveExam !== null) {
      return { ...parsedFromPost, dataSource: 'NOTICE_BOARD_DIRECT' };
    }

    const attachmentUrl = parseAttachmentUrl(detailHtml, matched.detailUrl);
    if (!attachmentUrl) return null;

    return {
      admissionYearFrom: null,
      totalCreditMin: null,
      creditBreakdown: null,
      comprehensiveExam: null,
      substitutionRules: [],
      dataSource: 'NOTICE_ATTACHMENT',
      attachmentUrl,
    };
  }
}
