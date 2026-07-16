import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { randomUUID } from 'crypto';
import { findOrCreateSemester } from '../common/semester.util';
import { PrismaService } from '../prisma/prisma.service';
import { CourseOfferingMatcherService } from './course-offering-matcher.service';
import { EverytimeBlockedError, EverytimeCrawlerService, EverytimeParseFailedError } from './everytime-crawler.service';
import type { CrawledCourse } from './everytime-html-parser';
import { EverytimeTextParserService } from './everytime-text-parser.service';
import { parseSemesterLabel, TERM_RANK } from './semester-label.util';

// 실제 공유(친구 시간표 보기) URL은 /timetable/ 세그먼트 없이 https://everytime.kr/@코드 형식이다
// (/timetable/@코드는 로그인한 본인 화면 경로이며 비로그인으로는 404 — 실제 URL로 검증 완료).
const EVERYTIME_URL_PATTERN = /^https:\/\/everytime\.kr\/@[\w-]+/;

// 개설과목 데이터의 이수구분은 "1전공기준"(그 과목을 개설한 학과 자신의 커리큘럼 기준)으로만
// 표기된다 — 학생이 그 학과를 제2전공(복수전공)으로 선택했어도 라벨은 그대로 "제1전공선택"으로
// 내려온다. 사용자 확인(실사용 중 발견): 개설 학과가 본인의 제2전공과 일치하면 라벨을 바로잡는다.
const SECOND_MAJOR_CATEGORY_REMAP: Record<string, string> = {
  제1전공선택: '제2전공선택',
  제1전공필수: '제2전공필수',
};

// 제1/2전공 어디에도 속하지 않는 학과가 개설한 과목은 원본이 "필수"였어도 이 학생에게는
// 필수일 수가 없다(그 학과 자신의 커리큘럼상 필수라는 뜻이지 이 학생의 전공 요건이 아님) —
// 선택/필수 구분 없이 전부 "타전공선택"으로 통일한다.
const OTHER_MAJOR_CATEGORY_REMAP: Record<string, string> = {
  제1전공선택: '타전공선택',
  제1전공필수: '타전공선택',
};

// 재분류 판단 대상은 "전공" 계열 라벨뿐이다 — 전공기초/교양 라벨은 이미 그대로 둬도 되는 경우가
// 대부분이라(전공기초는 제1/2전공 어느 쪽에서 들어도 그대로 전공기초로 취급하기로 함, 사용자 확인
// 대상 밖) 재분류 대상에서 제외한다.
const OWN_MAJOR_CATEGORIES = new Set(['제1전공선택', '제1전공필수']);

interface CourseInput {
  name: string;
  code: string | null;
  category: string | null;
  credit: number;
  offeringDepartmentName: string | null;
  foreignLanguageType: string | null;
}

type CourseSourceValue = 'CRAWL' | 'TEXT_PASTE' | 'MANUAL';

@Injectable()
export class EverytimeService {
  private readonly logger = new Logger(EverytimeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crawler: EverytimeCrawlerService,
    private readonly textParser: EverytimeTextParserService,
    private readonly offeringMatcher: CourseOfferingMatcherService,
  ) {}

  startSync(profile: Profile, url: string): { jobId: string; status: 'PENDING' } {
    if (!url || !EVERYTIME_URL_PATTERN.test(url)) {
      throw new BadRequestException('올바른 에브리타임 시간표 URL이 아닙니다.');
    }

    const jobId = `sync_${randomUUID().slice(0, 8)}`;
    // 크롤링은 여러 페이지를 순차 방문해 수 초~수십 초가 걸릴 수 있어, 응답은 즉시 202로
    // 반환하고 실제 처리는 백그라운드에서 진행한다. 완료 여부는 GET /api/profile의
    // syncedAt 또는 GET /api/everytime/semesters로 폴링해 확인한다([[구현 방식]] 3.2).
    this.runCrawlJob(profile, url, jobId).catch((error) => {
      this.logger.error(`[${jobId}] 동기화 실패 (profileId=${profile.id}): ${(error as Error).message}`);
    });

    return { jobId, status: 'PENDING' };
  }

  private async runCrawlJob(profile: Profile, url: string, jobId: string): Promise<void> {
    try {
      const semesters = await this.crawler.crawlAllSemesters(url);
      for (let i = 0; i < semesters.length; i += 1) {
        const semester = semesters[i];
        const courseInputs = await this.matchCourseOfferings(profile, semester.label, semester.courses);
        await this.upsertSemesterWithCourses(profile.id, semester.label, courseInputs, 'CRAWL', i === 0);
      }
      await this.prisma.profile.update({ where: { id: profile.id }, data: { syncedAt: new Date() } });
      this.logger.log(`[${jobId}] 동기화 완료: ${semesters.length}개 학기 (profileId=${profile.id})`);
    } catch (error) {
      if (error instanceof EverytimeBlockedError || error instanceof EverytimeParseFailedError) {
        this.logger.warn(`[${jobId}] ${error.message} — 유저는 텍스트 백업 파서로 안내되어야 함`);
        return;
      }
      throw error;
    }
  }

  // 에브리타임 공유 페이지엔 과목코드/학점이 없어([[Reload/🕷️ 에브리타임 실 URL 크롤러 재작성 및 프로덕션 Chromium 트러블슈팅]])
  // 트리니티 개설과목 리스트(CourseOffering, 수동 임포트)와 과목명+교수명으로 대조해 채워 넣는다.
  // 학기 라벨을 못 읽거나(텍스트 백업 등) 매칭에 실패하면 기존처럼 null로 남겨 needsSubstitution 흐름으로 넘긴다.
  private async matchCourseOfferings(
    profile: Profile,
    semesterLabel: string,
    courses: CrawledCourse[],
  ): Promise<CourseInput[]> {
    const parsedLabel = parseSemesterLabel(semesterLabel);
    if (!parsedLabel) {
      return courses.map((c) => ({
        name: c.name,
        code: null,
        category: null,
        credit: 0,
        offeringDepartmentName: null,
        foreignLanguageType: null,
      }));
    }

    const matchedResults = await this.offeringMatcher.matchMany(
      profile.universityId,
      parsedLabel.year,
      parsedLabel.term,
      courses,
    );
    const [majorDept, secondMajorDept] = await Promise.all([
      this.prisma.department.findUnique({ where: { id: profile.majorDepartmentId } }),
      profile.secondMajorDepartmentId
        ? this.prisma.department.findUnique({ where: { id: profile.secondMajorDepartmentId } })
        : Promise.resolve(null),
    ]);

    return courses.map((c, i) => {
      const matched = matchedResults[i];
      if (!matched) {
        return {
          name: c.name,
          code: null,
          category: null,
          credit: 0,
          offeringDepartmentName: null,
          foreignLanguageType: null,
        };
      }

      const category = this.reclassifyCategory(matched.category, matched.departmentName, majorDept?.name ?? null, secondMajorDept?.name ?? null);

      return {
        name: c.name,
        code: matched.code,
        category,
        credit: matched.credit,
        offeringDepartmentName: matched.departmentName,
        foreignLanguageType: matched.foreignLanguageType,
      };
    });
  }

  // 개설과목 데이터의 이수구분은 "그 과목을 개설한 학과 자신의 커리큘럼 기준"으로만 표기된다.
  // 학생 본인의 제1전공이 개설한 과목이면 라벨 그대로("제1전공선택"), 제2전공(복수전공)이 개설한
  // 과목이면 "제2전공선택/필수"로 바로잡는다(FIX#28). 제1/2전공 어디에도 속하지 않는 제3의 학과가
  // 개설한 과목(공유대학 등)은 원본 라벨이 "제1전공선택"이어도 이 학생 입장에서는 전공 요건이
  // 아니다(사용자 확인 — 포트폴리오와프레젠테이션이 무관한 학과 소속인데 전공으로 판정되던 문제).
  // "자유선택교양"으로 뭉뚱그리지 않고 "타전공선택/필수"로 남겨 어느 학과 과목인지(offeringDepartmentName)
  // 화면에 같이 보여줄 수 있게 한다 — 학점 계산에서는 category-key-map.ts가 자유선택교양과 동일하게
  // 취급한다.
  private reclassifyCategory(
    category: string,
    offeringDepartmentName: string,
    majorDeptName: string | null,
    secondMajorDeptName: string | null,
  ): string {
    if (!OWN_MAJOR_CATEGORIES.has(category)) return category;
    if (offeringDepartmentName === majorDeptName) return category;
    if (offeringDepartmentName === secondMajorDeptName) return SECOND_MAJOR_CATEGORY_REMAP[category] ?? category;
    return OTHER_MAJOR_CATEGORY_REMAP[category] ?? category;
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

    const courseInputs: CourseInput[] = courses.map((c) => ({
      ...c,
      category: null,
      offeringDepartmentName: null,
      foreignLanguageType: null,
    }));
    const semester = await this.upsertSemesterWithCourses(profile.id, semesterLabel.trim(), courseInputs, 'TEXT_PASTE', false);
    await this.prisma.profile.update({ where: { id: profile.id }, data: { syncedAt: new Date() } });

    return { semesterId: semester.id, parsedCourseCount: courses.length, unparsedLineCount };
  }

  async listSemesters(profile: Profile) {
    const semesters = await this.prisma.semester.findMany({
      where: { profileId: profile.id },
      orderBy: { sortOrder: 'asc' },
      include: { courses: { where: { general: false } } },
    });

    // sortOrder는 "크롤링 방문 순서"라 실제 학기 순서와 다를 수 있다 — 크롤러가 시작 URL의 학기를
    // 무조건 맨 앞에 놓고 나머지는 사이트 DOM 순서대로 방문하는데, 시작 URL이 최신 학기가 아니면
    // (예: 사용자가 과거 학기 공유 링크를 붙여넣은 경우) sortOrder 순서가 실제 연대순과 어긋난다.
    // 라벨("2025년 1학기")을 파싱해 진짜 연대순으로 다시 정렬하고, 파싱 안 되는 라벨(텍스트 백업 등
    // 자유 형식)만 기존 sortOrder 순서를 그대로 유지한다.
    const withRank = semesters.map((s) => ({ semester: s, parsed: parseSemesterLabel(s.label) }));
    withRank.sort((a, b) => {
      if (a.parsed && b.parsed) {
        if (a.parsed.year !== b.parsed.year) return b.parsed.year - a.parsed.year;
        return TERM_RANK[b.parsed.term] - TERM_RANK[a.parsed.term];
      }
      if (a.parsed) return -1;
      if (b.parsed) return 1;
      return a.semester.sortOrder - b.semester.sortOrder;
    });

    return {
      semesters: withRank.map(({ semester: s }) => ({
        id: s.id,
        label: s.label,
        active: s.active,
        courseCount: s.courses.length,
      })),
    };
  }

  async deleteSemester(profile: Profile, semesterId: number) {
    const semester = await this.prisma.semester.findUnique({ where: { id: semesterId } });
    if (!semester || semester.profileId !== profile.id) {
      throw new NotFoundException('존재하지 않는 학기 정보입니다.');
    }
    // courses는 onDelete: Cascade로 함께 삭제됨. RetakeGroup은 courseId 참조가 아니라 그때그때
    // 재계산되는 groupKey 기반이라 별도 정리 없이 다음 조회 시 자연히 갱신된다.
    await this.prisma.semester.delete({ where: { id: semesterId } });
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

    // 타전공학점인정: 이 학생의 제1전공 기준으로 인정 가능한 과목명 집합을 한 번만 조회해두고
    // 매 과목마다 이름으로 대조한다(엑셀 목록이 과목코드 개정 이력을 포함해 코드보다 이름이 안정적).
    const crossMajorEligibleNames = new Set(
      (
        await this.prisma.crossMajorCreditRecognition.findMany({
          where: { recognizingDepartmentId: profile.majorDepartmentId },
          select: { courseName: true },
        })
      ).map((r) => r.courseName),
    );

    return {
      courses: courses.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        category: c.category,
        credit: c.credit,
        general: c.general,
        foreignLanguageType: c.foreignLanguageType,
        offeringDepartmentName: c.offeringDepartmentName,
        isDuplicate: (nameCounts.get(c.name) ?? 0) > 1,
        // 요람 코드도 대체인정도 없지만 이수구분이 직접 지정된 과목(공유대학 등 요람 밖 과목을
        // "직접 입력하기"로 저장한 경우)은 더 이상 대체인정 대상으로 표시하지 않는다
        // (graduation.service.ts의 needsSubstitution 판정과 동일하게 맞춤).
        needsSubstitution: !c.general && !c.code && !c.substitution && !c.category,
        substitutionName: c.substitution?.name ?? null,
        crossMajorRecognized: c.crossMajorRecognized,
        crossMajorEligible: crossMajorEligibleNames.has(c.name),
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
          offeringDepartmentName: c.offeringDepartmentName,
          foreignLanguageType: c.foreignLanguageType,
          // general은 "교양 포함 여부"가 아니라 "실제 수업이 아닌 커스텀 일정(학생회 회의 등)인지" 여부다 —
          // 교양 과목도 진짜 수업이라 general: false로 메인 목록에 남아야 한다. FEAT#19 이후 실제 개설강좌와
          // 매칭되면 교양 과목도 code가 채워지므로, 매칭 실패(=code 없음)만으로 커스텀 일정을 가려낸다.
          general: !c.code,
          source,
        })),
      });
    }

    return semester;
  }
}
