import { Injectable, Logger } from '@nestjs/common';
import { ParsedAcademicRequirement, parseAcademicRequirementHtml } from './academic-requirement-parser';
import { CrawledCatalogCourse, parseCurriculumHtml } from './catalog-curriculum-parser';

export class CatalogCrawlFailedError extends Error {}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

export interface CrawlableDepartment {
  domainSlug: string;
  baseUrl: string;
  urlPattern: string;
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
  // 패턴이 동일해 urlPattern 분기 로직을 그대로 재사용한다.
  async crawlAcademicRequirement(department: CrawlableDepartment): Promise<ParsedAcademicRequirement> {
    switch (department.urlPattern) {
      case 'other-campus':
        throw new CatalogCrawlFailedError(`성의/성신교정 학과는 자동 크롤링 대상이 아닙니다: ${department.domainSlug}`);
      case 'subdirectory':
        return this.fetchAcademicRequirement(`${department.baseUrl.replace(/\/index\.do$/, '')}/course/academic.do`);
      case 'standard':
      default:
        return this.fetchAcademicRequirement(`${department.baseUrl}/${department.domainSlug}/course/academic.do`);
    }
  }

  private async fetchAcademicRequirement(url: string): Promise<ParsedAcademicRequirement> {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } }).catch(() => null);
    if (!response || !response.ok) {
      throw new CatalogCrawlFailedError(`학사정보 페이지에 접근할 수 없습니다: ${url}`);
    }

    const html = await response.text();
    const parsed = parseAcademicRequirementHtml(html);
    if (parsed.totalCreditMin === null && parsed.creditBreakdown === null && parsed.comprehensiveExam === null) {
      throw new CatalogCrawlFailedError(`학사정보 표를 찾을 수 없습니다: ${url}`);
    }

    return parsed;
  }
}
