import { Injectable, Logger } from '@nestjs/common';
import { chromium } from 'playwright';
import { CrawledCourse, parseTimetableHtml } from './everytime-html-parser';

export interface CrawledSemesterResult {
  label: string;
  sourceUrl: string;
  courses: CrawledCourse[];
}

export class EverytimeBlockedError extends Error {}
export class EverytimeParseFailedError extends Error {}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const BETWEEN_REQUEST_DELAY_MS = 1500;
const MAX_SEMESTERS = 12;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class EverytimeCrawlerService {
  private readonly logger = new Logger(EverytimeCrawlerService.name);

  async crawlAllSemesters(startUrl: string): Promise<CrawledSemesterResult[]> {
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext({ userAgent: USER_AGENT });
      const page = await context.newPage();

      const first = await this.fetchAndParse(page, startUrl);
      if (first.courses.length === 0 && first.semesterLinks.length === 0) {
        throw new EverytimeParseFailedError('시간표를 불러올 수 없습니다. 비공개 설정이거나 페이지 구조를 인식하지 못했습니다.');
      }

      const results: CrawledSemesterResult[] = [
        { label: first.semesterLabel ?? '현재 학기', sourceUrl: startUrl, courses: first.courses },
      ];

      const remainingLinks = first.semesterLinks.slice(0, MAX_SEMESTERS - 1);
      for (const link of remainingLinks) {
        await sleep(BETWEEN_REQUEST_DELAY_MS);
        try {
          const parsed = await this.fetchAndParse(page, link.url);
          results.push({ label: link.label, sourceUrl: link.url, courses: parsed.courses });
        } catch (error) {
          this.logger.warn(`과거 학기 크롤링 실패, 건너뜀: ${link.url} — ${(error as Error).message}`);
        }
      }

      return results;
    } finally {
      await browser.close();
    }
  }

  private async fetchAndParse(page: import('playwright').Page, url: string) {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => null);
    if (!response) {
      throw new EverytimeBlockedError('에브리타임 페이지에 접근할 수 없습니다.');
    }
    if (response.status() === 429 || response.status() === 403) {
      throw new EverytimeBlockedError('일시적으로 에브리타임 연동이 지연되고 있습니다.');
    }
    const html = await page.content();
    return parseTimetableHtml(html, url);
  }
}
