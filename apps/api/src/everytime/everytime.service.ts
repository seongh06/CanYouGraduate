import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { randomUUID } from 'crypto';
import { findOrCreateSemester } from '../common/semester.util';
import { PrismaService } from '../prisma/prisma.service';
import { EverytimeBlockedError, EverytimeCrawlerService, EverytimeParseFailedError } from './everytime-crawler.service';
import { EverytimeTextParserService } from './everytime-text-parser.service';

// 실제 공유(친구 시간표 보기) URL은 /timetable/ 세그먼트 없이 https://everytime.kr/@코드 형식이다
// (/timetable/@코드는 로그인한 본인 화면 경로이며 비로그인으로는 404 — 실제 URL로 검증 완료).
const EVERYTIME_URL_PATTERN = /^https:\/\/everytime\.kr\/@[\w-]+/;

interface CourseInput {
  name: string;
  code: string | null;
  category: string | null;
  credit: number;
}

type CourseSourceValue = 'CRAWL' | 'TEXT_PASTE' | 'MANUAL';

@Injectable()
export class EverytimeService {
  private readonly logger = new Logger(EverytimeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crawler: EverytimeCrawlerService,
    private readonly textParser: EverytimeTextParserService,
  ) {}

  startSync(profile: Profile, url: string): { jobId: string; status: 'PENDING' } {
    if (!url || !EVERYTIME_URL_PATTERN.test(url)) {
      throw new BadRequestException('올바른 에브리타임 시간표 URL이 아닙니다.');
    }

    const jobId = `sync_${randomUUID().slice(0, 8)}`;
    // 크롤링은 여러 페이지를 순차 방문해 수 초~수십 초가 걸릴 수 있어, 응답은 즉시 202로
    // 반환하고 실제 처리는 백그라운드에서 진행한다. 완료 여부는 GET /api/profile의
    // syncedAt 또는 GET /api/everytime/semesters로 폴링해 확인한다([[구현 방식]] 3.2).
    this.runCrawlJob(profile.id, url, jobId).catch((error) => {
      this.logger.error(`[${jobId}] 동기화 실패 (profileId=${profile.id}): ${(error as Error).message}`);
    });

    return { jobId, status: 'PENDING' };
  }

  private async runCrawlJob(profileId: number, url: string, jobId: string): Promise<void> {
    try {
      const semesters = await this.crawler.crawlAllSemesters(url);
      for (let i = 0; i < semesters.length; i += 1) {
        const semester = semesters[i];
        await this.upsertSemesterWithCourses(profileId, semester.label, semester.courses, 'CRAWL', i === 0);
      }
      await this.prisma.profile.update({ where: { id: profileId }, data: { syncedAt: new Date() } });
      this.logger.log(`[${jobId}] 동기화 완료: ${semesters.length}개 학기 (profileId=${profileId})`);
    } catch (error) {
      if (error instanceof EverytimeBlockedError || error instanceof EverytimeParseFailedError) {
        this.logger.warn(`[${jobId}] ${error.message} — 유저는 텍스트 백업 파서로 안내되어야 함`);
        return;
      }
      throw error;
    }
  }

  async syncFromText(profile: Profile, semesterLabel: string, rawText: string) {
    if (!semesterLabel || !semesterLabel.trim()) {
      throw new BadRequestException('학기 라벨(semesterLabel)은 필수입니다.');
    }
    if (!rawText || !rawText.trim()) {
      throw new BadRequestException('인식 가능한 과목 정보를 찾지 못했습니다. 시간표 화면 전체를 복사했는지 확인해주세요.');
    }

    const { courses, unparsedLineCount } = this.textParser.parse(rawText);
    if (courses.length === 0) {
      throw new BadRequestException('인식 가능한 과목 정보를 찾지 못했습니다. 시간표 화면 전체를 복사했는지 확인해주세요.');
    }

    const courseInputs: CourseInput[] = courses.map((c) => ({ ...c, category: null }));
    const semester = await this.upsertSemesterWithCourses(profile.id, semesterLabel.trim(), courseInputs, 'TEXT_PASTE', false);
    await this.prisma.profile.update({ where: { id: profile.id }, data: { syncedAt: new Date() } });

    return { semesterId: semester.id, parsedCourseCount: courses.length, unparsedLineCount };
  }

  async listSemesters(profile: Profile) {
    const semesters = await this.prisma.semester.findMany({
      where: { profileId: profile.id },
      orderBy: { sortOrder: 'desc' },
      include: { courses: { where: { general: false } } },
    });

    return {
      semesters: semesters.map((s) => ({
        id: s.id,
        label: s.label,
        active: s.active,
        courseCount: s.courses.length,
      })),
    };
  }

  async listCourses(profile: Profile, semesterId: number, includeGeneral: boolean) {
    const semester = await this.prisma.semester.findUnique({ where: { id: semesterId } });
    if (!semester || semester.profileId !== profile.id) {
      throw new NotFoundException('존재하지 않는 학기 정보입니다.');
    }

    const allNonGeneral = await this.prisma.course.findMany({
      where: { semester: { profileId: profile.id }, general: false },
      select: { name: true },
    });
    const nameCounts = new Map<string, number>();
    for (const c of allNonGeneral) {
      nameCounts.set(c.name, (nameCounts.get(c.name) ?? 0) + 1);
    }

    const courses = await this.prisma.course.findMany({
      where: { semesterId, ...(includeGeneral ? {} : { general: false }) },
      orderBy: { id: 'asc' },
      include: { substitution: true },
    });

    return {
      courses: courses.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        category: c.category,
        credit: c.credit,
        general: c.general,
        isDuplicate: (nameCounts.get(c.name) ?? 0) > 1,
        needsSubstitution: !c.general && !c.code && !c.substitution,
        substitutionName: c.substitution?.name ?? null,
      })),
    };
  }

  private async upsertSemesterWithCourses(
    profileId: number,
    label: string,
    courses: CourseInput[],
    source: CourseSourceValue,
    markActiveIfFirst: boolean,
  ) {
    const semester = await findOrCreateSemester(this.prisma, profileId, label, markActiveIfFirst);

    const existingCourseCount = await this.prisma.course.count({ where: { semesterId: semester.id } });
    if (existingCourseCount === 0 && courses.length > 0) {
      await this.prisma.course.createMany({
        data: courses.map((c) => ({
          semesterId: semester.id,
          name: c.name,
          code: c.code,
          category: c.category,
          credit: c.credit,
          general: !c.code,
          source,
        })),
      });
    }

    return semester;
  }
}
