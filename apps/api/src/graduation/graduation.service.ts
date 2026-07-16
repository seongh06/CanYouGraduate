import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CatalogGraduationRequirement, Profile } from '@prisma/client';
import { courseNameMatchesPattern } from '../common/course-name-match.util';
import { groupDuplicateCourses } from '../common/retake-grouping.util';
import { PrismaService } from '../prisma/prisma.service';
import { CATEGORY_KEY_LABEL, resolveCategories } from './category-key-map';
import { getCommonLiberalArtsRequirement } from './common-liberal-arts';

// 부전공 졸업요건은 학과별 데이터가 없어 가톨릭대 공통 최소학점(21학점)을 고정 기준으로 쓴다(이슈 #51,
// 사용자 확인). 요람 데이터가 갖춰지면 학과별 요건으로 대체 가능하도록 상수로 분리해둔다.
const MINOR_REQUIRED_CREDIT = 21;

// 학과별 creditBreakdown JSON에 남아있던 기초/중핵교양 관련 키(크롤러 한글 헤더 + 레거시 영어 키
// 두 체계 모두) — commonLiberalArts 고정 테이블로 대체됐으므로 학과별 표시에서는 제외한다.
const COMMON_LIBERAL_ARTS_KEYS = new Set([
  '기초필수',
  '중핵교양',
  '교양이수학점 계',
  'generalBasicRequired',
  'generalCore',
  'general',
]);

interface ResolvedCourse {
  name: string;
  category: string | null;
  credit: number;
  offeringDepartmentName: string | null;
  needsSubstitution: boolean;
  foreignLanguageType: string | null;
}

export interface SuggestedCourses {
  first: string[];
  second: string[];
  unknown: string[];
}

export type CreditBreakdownItem =
  | { key: string; label: string; required: number; earned: number; status: 'pass'; earnedCourses: string[] }
  | {
      key: string;
      label: string;
      required: number;
      earned: number;
      status: 'fail';
      earnedCourses: string[];
      suggestedCourses?: SuggestedCourses | null;
    }
  | { key: string; label: string; required: number; earned: null; status: 'unavailable'; note: string; earnedCourses?: string[] };

type MajorSlot = 'FIRST' | 'SECOND';

export interface MajorResult {
  totalCreditMin: number | null;
  creditBreakdown: CreditBreakdownItem[];
  comprehensiveExam: unknown;
  substitutionRules: unknown;
  mandatoryRequirements: unknown;
  languageScoreStandard: unknown;
  thesisOptional: boolean;
}

// 복수전공자인데 그 학과의 졸업요건 데이터가 아직 시딩 안 된 경우(43개 학과가 전체를 못 채움)의
// 기본값 — 계산 자체를 막지 않고 "아직 준비 안 됨" 상태로 내려준다.
const EMPTY_REQUIREMENT_VIEW = {
  totalCreditMin: null,
  creditBreakdownRequired: {},
  comprehensiveExam: null,
  substitutionRules: [],
  mandatoryRequirements: [],
  languageScoreStandard: null,
  thesisOptional: false,
};

@Injectable()
export class GraduationService {
  constructor(private readonly prisma: PrismaService) {}

  async getRequirements(profile: Profile, trackOverride?: number) {
    const requirement = await this.findRequirement(profile, trackOverride);
    const secondRequirement = await this.findSecondMajorRequirement(profile);
    const catholicChecks = await this.listApplicableCatholicChecks(profile);

    return {
      ...this.toRequirementView(requirement),
      secondMajor:
        profile.programType === 'DOUBLE_MAJOR'
          ? secondRequirement
            ? this.toRequirementView(secondRequirement)
            : EMPTY_REQUIREMENT_VIEW
          : null,
      catholicChecks: catholicChecks.map((c) => ({ key: c.key, label: c.label })),
    };
  }

  async calculate(profile: Profile, trackOverride?: number) {
    const requirement = await this.findRequirement(profile, trackOverride);
    const resolvedCourses = await this.resolveCourses(profile);

    if (resolvedCourses.some((c) => c.needsSubstitution)) {
      throw new ConflictException('학과개편 대체인정 미설정 과목이 있습니다. 검증 단계에서 먼저 처리해주세요.');
    }

    const totalCredits = resolvedCourses.reduce((sum, c) => sum + c.credit, 0);
    const totalCreditMin = requirement.totalCreditMin;
    const remainingCredits = totalCreditMin !== null ? Math.max(totalCreditMin - totalCredits, 0) : null;
    const completionPercent =
      totalCreditMin && totalCreditMin > 0 ? Math.min(Math.round((totalCredits / totalCreditMin) * 100), 100) : null;

    const takenNames = new Set(resolvedCourses.map((c) => c.name));
    const creditBreakdown = await this.buildCreditBreakdownWithSuggestions(
      profile.majorDepartmentId,
      'FIRST',
      requirement,
      resolvedCourses,
      takenNames,
      profile.programType === 'DOUBLE_MAJOR',
    );

    const secondMajor = await this.buildSecondMajorResult(profile, resolvedCourses, takenNames);

    const minorDept = profile.minorDepartmentId
      ? await this.prisma.department.findUnique({ where: { id: profile.minorDepartmentId } })
      : null;
    const minor = minorDept
      ? {
          requiredCredit: MINOR_REQUIRED_CREDIT,
          earnedCredit: resolvedCourses
            .filter((c) => c.offeringDepartmentName === minorDept.name)
            .reduce((sum, c) => sum + c.credit, 0),
        }
      : null;

    // 외국어강의 이수 학점 — 학과·학번마다 요구 기준이 달라 아직 고정 요건 데이터가 없다.
    // 요건이 갖춰지기 전까지는 pass/fail 판정 없이 정보성 카운트만 제공한다(이슈 #53).
    const foreignLanguageCourses = resolvedCourses.filter((c) => !!c.foreignLanguageType);
    const foreignLanguageCredits = {
      count: foreignLanguageCourses.length,
      totalCredit: foreignLanguageCourses.reduce((sum, c) => sum + c.credit, 0),
      courses: foreignLanguageCourses.map((c) => c.name),
    };

    const extra = await this.getOrCreateExtra(profile.id);
    const catholicChecksCatalog = await this.listApplicableCatholicChecks(profile);
    const checkedMap = (extra.catholicChecks ?? {}) as Record<string, boolean>;

    const majorDeptName = await this.getMajorDepartmentName(profile);
    const commonLiberalArts = this.buildCommonLiberalArts(
      profile,
      resolvedCourses,
      catholicChecksCatalog,
      checkedMap,
      majorDeptName,
    );

    const languageStandard = (requirement.languageScoreStandard ?? {}) as Record<string, number>;
    const languageScorePass =
      extra.languageExamType && extra.languageScore !== null && languageStandard[extra.languageExamType] !== undefined
        ? extra.languageScore >= languageStandard[extra.languageExamType]
        : null;

    return {
      totalCredits,
      totalCreditMin,
      remainingCredits,
      completionPercent,
      creditBreakdown,
      commonLiberalArts,
      minor,
      foreignLanguageCredits,
      comprehensiveExam: requirement.comprehensiveExam,
      substitutionRules: requirement.substitutionRules,
      mandatoryRequirements: requirement.mandatoryRequirements,
      secondMajor,
      languageScore: extra.languageScore,
      languageExamType: extra.languageExamType,
      languageScorePass,
      thesisPass: extra.thesisPass,
      thesisOptional: requirement.thesisOptional,
      catholicChecks: catholicChecksCatalog.map((c) => {
        const autoDetected =
          c.matchPatterns.length > 0 &&
          resolvedCourses.some((course) => c.matchPatterns.some((pattern) => courseNameMatchesPattern(course.name, pattern)));
        const manualOverride = checkedMap[c.key];
        return {
          key: c.key,
          label: c.label,
          checked: manualOverride !== undefined ? manualOverride : autoDetected,
          autoDetected,
        };
      }),
    };
  }

  // 기초교양필수/중핵교양선택필수 학점 계산 — 고정 이름이 있는 항목(인간학/키스톤디자인/
  // 그리스도교사상과문화/사랑나누기/I-DESIGN/Career-DESIGN)은 CatalogCatholicCheck 매칭으로,
  // 고정 이름이 없는 영역선택 교양(인문사회/자연과학/휴먼테크/글로벌영어 등)은 category 문자열로
  // 판정한다. 전자를 category로만 판정하면 실제 크롤링 category 표기가 일정하지 않아 놓치는
  // 경우가 있었다(이슈 #53 — I-DESIGN/Career-DESIGN이 중핵교양 학점에 안 잡히던 문제).
  private buildCommonLiberalArts(
    profile: Profile,
    resolvedCourses: ResolvedCourse[],
    catholicChecksCatalog: Array<{ key: string; matchPatterns: string[]; credit: number | null; creditGroup: string | null }>,
    checkedMap: Record<string, boolean>,
    majorDeptName: string | null,
  ) {
    const commonReq = getCommonLiberalArtsRequirement(profile.admissionYear, majorDeptName ?? '');
    if (!commonReq) return null;

    let basicEarned = 0;
    let coreEarned = 0;
    const basicCourses: string[] = [];
    const coreCourses: string[] = [];
    const matchedNames = new Set<string>();

    for (const check of catholicChecksCatalog) {
      if (!check.creditGroup || !check.credit) continue;

      const matches = resolvedCourses.filter((c) =>
        check.matchPatterns.some((pattern) => courseNameMatchesPattern(c.name, pattern)),
      );
      const autoDetected = matches.length > 0;
      const manualOverride = checkedMap[check.key];
      const satisfied = manualOverride !== undefined ? manualOverride : autoDetected;
      if (!satisfied) continue;

      const targetCourses = check.creditGroup === 'BASIC' ? basicCourses : coreCourses;
      if (matches.length > 0) {
        for (const m of matches) {
          matchedNames.add(m.name);
          targetCourses.push(m.name);
        }
        const creditSum = matches.reduce((sum, m) => sum + m.credit, 0);
        if (check.creditGroup === 'BASIC') basicEarned += creditSum;
        else coreEarned += creditSum;
      } else {
        // 수동으로 체크했지만 자동 매칭되는 과목이 없는 경우 — 과목명 없이 항목의 고정 학점만 인정.
        if (check.creditGroup === 'BASIC') basicEarned += check.credit;
        else coreEarned += check.credit;
      }
    }

    // 고정 이름이 없는 영역선택 교양 — 이미 위에서 매칭된 과목은 중복 집계하지 않는다.
    for (const c of resolvedCourses) {
      if (matchedNames.has(c.name)) continue;
      if (c.category === '기초교양필수') {
        basicEarned += c.credit;
        basicCourses.push(c.name);
      } else if (c.category === '중핵교양필수') {
        coreEarned += c.credit;
        coreCourses.push(c.name);
      }
    }

    return {
      basicRequired: commonReq.basicRequired,
      basicEarned,
      basicCourses,
      coreRequired: commonReq.coreRequired,
      coreEarned,
      coreCourses,
    };
  }

  private toRequirementView(requirement: CatalogGraduationRequirement) {
    return {
      totalCreditMin: requirement.totalCreditMin,
      creditBreakdownRequired: requirement.creditBreakdown ?? {},
      comprehensiveExam: requirement.comprehensiveExam,
      substitutionRules: requirement.substitutionRules,
      mandatoryRequirements: requirement.mandatoryRequirements,
      languageScoreStandard: requirement.languageScoreStandard,
      thesisOptional: requirement.thesisOptional,
    };
  }

  // 복수전공(제2전공) 자체 졸업요건. secondMajorDepartmentId가 있어도 그 학과 요건 데이터가
  // 아직 없을 수 있어(43개 학과 시딩이 전체를 못 채움) requirement가 null이면 계산을 막지 않고
  // "데이터 없음" 상태(빈 creditBreakdown)로 내려준다.
  private async buildSecondMajorResult(
    profile: Profile,
    resolvedCourses: ResolvedCourse[],
    takenNames: Set<string>,
  ): Promise<MajorResult | null> {
    if (profile.programType !== 'DOUBLE_MAJOR' || !profile.secondMajorDepartmentId) return null;

    const requirement = await this.findSecondMajorRequirement(profile);
    if (!requirement) {
      return {
        totalCreditMin: null,
        creditBreakdown: [],
        comprehensiveExam: null,
        substitutionRules: [],
        mandatoryRequirements: [],
        languageScoreStandard: null,
        thesisOptional: false,
      };
    }

    // 여기 도달했다는 건 이미 profile.programType === 'DOUBLE_MAJOR'라는 뜻 — 이 학과는 언제나
    // "복수전공 기준"(doubleMajorMin)으로 본다.
    const creditBreakdown = await this.buildCreditBreakdownWithSuggestions(
      profile.secondMajorDepartmentId,
      'SECOND',
      requirement,
      resolvedCourses,
      takenNames,
      true,
    );

    return {
      totalCreditMin: requirement.totalCreditMin,
      creditBreakdown,
      comprehensiveExam: requirement.comprehensiveExam,
      substitutionRules: requirement.substitutionRules,
      mandatoryRequirements: requirement.mandatoryRequirements,
      languageScoreStandard: requirement.languageScoreStandard,
      thesisOptional: requirement.thesisOptional,
    };
  }

  // commonLiberalArts(기초/중핵교양 공통표) 조회는 학번뿐 아니라 제1전공 학과명도 키로 쓴다
  // (글로벌경영학과/약학과 예외 — common-liberal-arts.ts 참고).
  private async getMajorDepartmentName(profile: Profile): Promise<string | null> {
    const majorDept = await this.prisma.department.findUnique({ where: { id: profile.majorDepartmentId } });
    return majorDept?.name ?? null;
  }

  private async buildCreditBreakdownWithSuggestions(
    departmentId: number,
    slot: MajorSlot,
    requirement: CatalogGraduationRequirement,
    courses: ResolvedCourse[],
    takenNames: Set<string>,
    preferDoubleMajorMin: boolean,
  ): Promise<CreditBreakdownItem[]> {
    const creditBreakdown = this.calculateCreditBreakdown(requirement, courses, slot, preferDoubleMajorMin);
    const suggestions = await this.suggestCourses(departmentId, slot, creditBreakdown, takenNames);
    const withSuggestions = creditBreakdown.map((item) =>
      item.status === 'fail' ? { ...item, suggestedCourses: suggestions[item.key] ?? null } : item,
    );

    // 이 전공(슬롯) 소속 과목 중 외국어강의 정보성 표시 — 학과·학번별 필요 학점 기준이 없어
    // pass/fail 판정 없이 몇 과목·몇 학점인지, 어떤 과목인지만 보여준다(사용자 요청, 이슈 #53 후속).
    const ownMajorCategories = slot === 'FIRST' ? ['제1전공선택', '제1전공필수'] : ['제2전공선택', '제2전공필수'];
    const foreignLanguageCourses = courses.filter(
      (c) => c.category && ownMajorCategories.includes(c.category) && !!c.foreignLanguageType,
    );
    if (foreignLanguageCourses.length === 0) return withSuggestions;

    const foreignLanguageItem: CreditBreakdownItem = {
      key: 'foreignLanguage',
      label: '외국어강의',
      required: 0,
      earned: null,
      status: 'unavailable',
      note: `${foreignLanguageCourses.reduce((sum, c) => sum + c.credit, 0)}학점(${foreignLanguageCourses.length}과목) 이수 — 학과·학번별 기준 정보 없음`,
      earnedCourses: foreignLanguageCourses.map((c) => c.name),
    };
    return [...withSuggestions, foreignLanguageItem];
  }

  async updateCheck(profile: Profile, checkKey: string, checked: unknown) {
    if (typeof checked !== 'boolean') {
      throw new BadRequestException('체크 여부(checked) 값이 올바르지 않습니다.');
    }
    const check = await this.prisma.catalogCatholicCheck.findFirst({
      where: { universityId: profile.universityId, key: checkKey },
    });
    if (!check) throw new NotFoundException('존재하지 않는 체크리스트 항목입니다.');

    const extra = await this.getOrCreateExtra(profile.id);
    const checks = { ...(extra.catholicChecks as Record<string, boolean>), [checkKey]: checked };
    await this.prisma.graduationExtra.update({ where: { profileId: profile.id }, data: { catholicChecks: checks } });
  }

  async updateLanguageScore(profile: Profile, examType: unknown, score: unknown) {
    if (!examType || typeof examType !== 'string') {
      throw new BadRequestException('시험 종류(examType)는 필수입니다.');
    }
    if (typeof score !== 'number' || Number.isNaN(score) || score < 0) {
      throw new BadRequestException('올바른 점수를 입력해주세요.');
    }

    const requirement = await this.findRequirement(profile);
    const standard = (requirement.languageScoreStandard ?? {}) as Record<string, number>;
    if (!(examType in standard)) {
      throw new BadRequestException('해당 학과에서 지원하지 않는 시험 종류입니다.');
    }

    await this.getOrCreateExtra(profile.id);
    await this.prisma.graduationExtra.update({
      where: { profileId: profile.id },
      data: { languageScore: score, languageExamType: examType },
    });

    return { examType, score, pass: score >= standard[examType] };
  }

  async updateThesis(profile: Profile, pass: unknown) {
    if (typeof pass !== 'boolean') {
      throw new BadRequestException('Pass 여부(pass) 값이 올바르지 않습니다.');
    }
    await this.getOrCreateExtra(profile.id);
    await this.prisma.graduationExtra.update({ where: { profileId: profile.id }, data: { thesisPass: pass } });
  }

  // majorDepartmentId는 정의상 이 학생의 "제1전공"이므로 scope는 항상 FIRST_MAJOR 관점으로 조회한다.
  // profile.programType(복수전공 보유 여부)과는 별개 축 — CodeRabbit 리뷰로 발견: 원래 코드는
  // programType이 DOUBLE_MAJOR면 제1전공 조회에도 DOUBLE_MAJOR scope를 썼는데, 그러면 생명공학과처럼
  // FIRST_MAJOR/DOUBLE_MAJOR 두 행이 있는 학과가 본인 제1전공일 때도(예: 취업상담 등 1전공자 전용
  // 필수요건이 있는 학과) 잘못 완화된 DOUBLE_MAJOR 행을 골라버리는 버그였다.
  // trackOverride: 결과화면 트랙 미리보기용 — 주어지면 프로필에 저장된 majorTrackId 대신 이
  // 값으로 조회한다(프로필엔 반영 안 됨, 순수 조회 시점 override).
  private async findRequirement(profile: Profile, trackOverride?: number): Promise<CatalogGraduationRequirement> {
    const requirement = await this.findRequirementForDept(
      profile.majorDepartmentId,
      trackOverride ?? profile.majorTrackId,
      profile.admissionYear,
      'FIRST_MAJOR',
    );
    if (!requirement) {
      throw new NotFoundException('아직 해당 학과의 요람 데이터가 준비되지 않았습니다.');
    }
    return requirement;
  }

  // 제2전공(복수전공) 관점의 요건 — 그 학과에서 이 학생은 언제나 "복수전공자"이므로 scope는
  // DOUBLE_MAJOR로 고정한다(findRequirement의 perspective와 다른 개념 — 저 쪽은 학생 본인의
  // programType 기준, 이 쪽은 상대 학과 입장에서 본 이 학생의 역할 기준).
  private async findSecondMajorRequirement(profile: Profile): Promise<CatalogGraduationRequirement | null> {
    if (profile.programType !== 'DOUBLE_MAJOR' || !profile.secondMajorDepartmentId) return null;
    return this.findRequirementForDept(
      profile.secondMajorDepartmentId,
      profile.secondMajorTrackId,
      profile.admissionYear,
      'DOUBLE_MAJOR',
    );
  }

  // scope(ALL/FIRST_MAJOR/DOUBLE_MAJOR)와 track을 모두 고려한 공용 조회. 학생이 트랙을 선택한
  // 경우에만 트랙 조건을 걸고(트랙형 학과는 그 트랙 행을, 무트랙 학과는 trackId null 행을 매치),
  // 트랙 미선택(majorTrackId/secondMajorTrackId가 null인 프로필 — 온보딩에서 트랙 선택이 강제가
  // 아님)이면 트랙 조건 자체를 안 건다. 안 그러면 트랙형 학과(mtc 등)에서 트랙 미선택 학생은
  // trackId=null인 행이 애초에 없어 findFirst가 0건을 반환해 404가 난다(배포 후 실사용자 세션으로
  // 재현·확인함).
  private findRequirementForDept(
    departmentId: number,
    trackId: number | null,
    admissionYear: number,
    perspective: 'FIRST_MAJOR' | 'DOUBLE_MAJOR',
  ): Promise<CatalogGraduationRequirement | null> {
    return this.prisma.catalogGraduationRequirement.findFirst({
      where: {
        departmentId,
        AND: [
          { OR: [{ admissionYearFrom: null }, { admissionYearFrom: { lte: admissionYear } }] },
          { OR: [{ admissionYearTo: null }, { admissionYearTo: { gte: admissionYear } }] },
          { OR: [{ scope: 'ALL' }, { scope: perspective }] },
          ...(trackId !== null ? [{ OR: [{ trackId: null }, { trackId }] }] : []),
        ],
      },
    });
  }

  private async listApplicableCatholicChecks(profile: Profile) {
    const all = await this.prisma.catalogCatholicCheck.findMany({
      where: { universityId: profile.universityId },
      orderBy: { id: 'asc' }, // 학년 순서(id 배정 순서)대로 노출
    });
    return all.filter(
      (c) =>
        (c.admissionYearFrom === null || c.admissionYearFrom <= profile.admissionYear) &&
        (c.admissionYearTo === null || c.admissionYearTo >= profile.admissionYear),
    );
  }

  // 재수강(retakeGroups) + 대체인정(substitution) 반영 완료 상태의 과목 목록을 반환한다.
  // course.service.ts의 listDuplicates와 동일한 정렬·그룹핑을 써야 같은 groupKey를 가리킨다.
  private async resolveCourses(profile: Profile): Promise<ResolvedCourse[]> {
    const courses = await this.prisma.course.findMany({
      where: { semester: { profileId: profile.id }, general: false },
      orderBy: [{ semester: { sortOrder: 'asc' } }, { id: 'asc' }],
      include: { substitution: true },
    });

    const groups = groupDuplicateCourses(courses);
    const retakeGroups = await this.prisma.retakeGroup.findMany({ where: { profileId: profile.id } });
    const retakeMap = new Map(retakeGroups.map((g) => [g.groupKey, g.retakeAccepted]));

    const excludedIds = new Set<number>();
    for (const [groupKey, list] of groups) {
      if (list.length <= 1) continue;
      const accepted = retakeMap.get(groupKey) ?? true;
      // 재수강 인정: 최신 기록(list[0])만 남기고 이전 기록은 학점 계산에서 제외
      if (accepted) {
        for (const c of list.slice(1)) excludedIds.add(c.id);
      }
    }

    return courses
      .filter((c) => !excludedIds.has(c.id))
      .map((c) => ({
        name: c.name,
        // 타전공학점인정 신청(crossMajorRecognized)된 과목은 원래 이수구분(자유선택교양/타전공선택
        // 등)과 무관하게 전공선택으로 취급한다 — 대체인정(substitution)이 있으면 그쪽이 우선.
        category: c.substitution ? c.substitution.category : c.crossMajorRecognized ? '제1전공선택' : c.category,
        credit: c.substitution ? c.substitution.credit : c.credit,
        offeringDepartmentName: c.offeringDepartmentName,
        // 요람 코드도 대체인정도 없지만 사용자가 이수구분을 직접 지정한 과목(공유대학 등 요람에
        // 아예 없는 과목)은 그 지정을 신뢰하고 계산을 막지 않는다.
        needsSubstitution: !c.code && !c.substitution && !c.category,
        foreignLanguageType: c.foreignLanguageType,
      }));
  }

  private calculateCreditBreakdown(
    requirement: CatalogGraduationRequirement,
    courses: ResolvedCourse[],
    slot: MajorSlot,
    preferDoubleMajorMin: boolean,
  ): CreditBreakdownItem[] {
    const breakdown = (requirement.creditBreakdown ?? {}) as Record<string, number>;
    if (Object.keys(breakdown).length === 0) return [];

    return Object.entries(breakdown)
      // majorDeepMin(전공심화 기준)과 doubleMajorMin(복수전공 기준)은 같은 과목을 세는 서로 다른
      // 학점 문턱값이라 동시에 적용될 수 없다 — 이 학생 상황에 맞는 쪽 하나만 보여준다.
      // 기초교양/중핵교양은 학과 무관 공통 요건이라 common-liberal-arts.ts 고정 테이블로 따로
      // 계산해서 탭 바깥에 보여준다 — 여기(학과별 창구)에 다시 나오면 학과 요건처럼 오해할 수 있어
      // 제외한다(이슈 #51, 컴공에서 "자유선택교양 25학점"으로 오해했던 문제의 근본 원인).
      .filter(([key]) => {
        if (key === 'majorDeepMin') return !preferDoubleMajorMin;
        if (key === 'doubleMajorMin') return preferDoubleMajorMin;
        if (COMMON_LIBERAL_ARTS_KEYS.has(key)) return false;
        return true;
      })
      .map(([key, required]) => {
        const categories = resolveCategories(key, slot);
        if (!categories) {
          return {
            key,
            label: CATEGORY_KEY_LABEL[key] ?? key,
            required,
            earned: null,
            status: 'unavailable' as const,
            note: '과목별 소속 전공 구분 불가(요람/개설과목 데이터엔 학생 본인 기준 전공 소속이 없음)',
          };
        }

        let earned = 0;
        const earnedCourses: string[] = [];
        for (const c of courses) {
          if (!c.category) continue;
          // 중핵교양필수/전공기초는 본인 전공 학과가 개설했더라도 전공선택 학점(major 등)에 포함되지
          // 않는다(사용자 정정 — 이슈 #53. 예전엔 본인 학과 개설 중핵교양을 전공으로 재분류했었으나
          // 실제 학칙상 별도 카테고리로, 전공 이수학점 계산에 합산되지 않는다는 걸 재확인함).
          if (categories.includes(c.category)) {
            earned += c.credit;
            earnedCourses.push(c.name);
          }
        }

        return {
          key,
          label: CATEGORY_KEY_LABEL[key] ?? key,
          required,
          earned,
          earnedCourses,
          status: earned >= required ? ('pass' as const) : ('fail' as const),
        };
      });
  }

  // 부족한 카테고리별로 아직 안 들은 요람 과목을 찾고, 최근 2개년 개설이력(CourseOffering)에서
  // 1학기/2학기 어느 쪽에 열렸는지 조회해 버킷팅한다. 개설이력 자체가 없는 과목은 "미확인"으로 남긴다.
  // 어디까지나 추천이라 카테고리당 최대 5개까지만 노출한다 — 프론트에 항상 "실제로 안 열릴 수
  // 있다" 안내문을 같이 보여주는 게 전제.
  private async suggestCourses(
    departmentId: number,
    slot: MajorSlot,
    creditBreakdown: CreditBreakdownItem[],
    takenNames: Set<string>,
  ): Promise<Record<string, SuggestedCourses>> {
    const failing = creditBreakdown.filter((item) => item.status === 'fail');
    if (failing.length === 0) return {};

    const department = await this.prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) return {};

    const currentYear = new Date().getFullYear();
    const suggestions: Record<string, SuggestedCourses> = {};

    for (const item of failing) {
      const categories = resolveCategories(item.key, slot);
      if (!categories) continue;

      const candidates = await this.prisma.catalogCourse.findMany({
        where: { departmentId, category: { in: categories } },
        select: { name: true },
        take: 40,
      });
      const names = candidates.map((c) => c.name).filter((name) => !takenNames.has(name));
      if (names.length === 0) continue;

      const offerings = await this.prisma.courseOffering.findMany({
        where: { departmentName: department.name, name: { in: names }, year: { gte: currentYear - 2 } },
        select: { name: true, term: true },
      });
      const termsByName = new Map<string, Set<string>>();
      for (const o of offerings) {
        if (!termsByName.has(o.name)) termsByName.set(o.name, new Set());
        termsByName.get(o.name)!.add(o.term);
      }

      const first: string[] = [];
      const second: string[] = [];
      const unknown: string[] = [];
      for (const name of names) {
        const terms = termsByName.get(name);
        if (!terms || terms.size === 0) {
          if (unknown.length < 5) unknown.push(name);
          continue;
        }
        if (terms.has('1학기') && first.length < 5) first.push(name);
        if (terms.has('2학기') && second.length < 5) second.push(name);
      }

      if (first.length || second.length || unknown.length) {
        suggestions[item.key] = { first, second, unknown };
      }
    }

    return suggestions;
  }

  private async getOrCreateExtra(profileId: number) {
    const existing = await this.prisma.graduationExtra.findUnique({ where: { profileId } });
    if (existing) return existing;
    return this.prisma.graduationExtra.create({ data: { profileId } });
  }
}
