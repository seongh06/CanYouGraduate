import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CatalogGraduationRequirement, Profile } from '@prisma/client';
import { groupDuplicateCourses } from '../common/retake-grouping.util';
import { PrismaService } from '../prisma/prisma.service';
import { CATEGORY_KEY_LABEL, resolveCategories } from './category-key-map';

interface ResolvedCourse {
  name: string;
  category: string | null;
  credit: number;
  offeringDepartmentName: string | null;
  needsSubstitution: boolean;
}

export interface SuggestedCourses {
  first: string[];
  second: string[];
  unknown: string[];
}

export type CreditBreakdownItem =
  | { key: string; label: string; required: number; earned: number; status: 'pass' }
  | {
      key: string;
      label: string;
      required: number;
      earned: number;
      status: 'fail';
      suggestedCourses?: SuggestedCourses | null;
    }
  | { key: string; label: string; required: number; earned: null; status: 'unavailable'; note: string };

type MajorSlot = 'FIRST' | 'SECOND';

export interface MajorResult {
  totalCreditMin: number | null;
  creditBreakdown: CreditBreakdownItem[];
  comprehensiveExam: unknown;
  substitutionRules: unknown;
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
  languageScoreStandard: null,
  thesisOptional: false,
};

@Injectable()
export class GraduationService {
  constructor(private readonly prisma: PrismaService) {}

  async getRequirements(profile: Profile) {
    const requirement = await this.findRequirement(profile);
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

  async calculate(profile: Profile) {
    const requirement = await this.findRequirement(profile);
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
    const ownDeptNames = await this.getOwnDeptNames(profile);
    const creditBreakdown = await this.buildCreditBreakdownWithSuggestions(
      profile.majorDepartmentId,
      'FIRST',
      requirement,
      resolvedCourses,
      takenNames,
      ownDeptNames.first,
    );

    const secondMajor = await this.buildSecondMajorResult(profile, resolvedCourses, takenNames, ownDeptNames.second);

    const extra = await this.getOrCreateExtra(profile.id);
    const catholicChecksCatalog = await this.listApplicableCatholicChecks(profile);
    const checkedMap = (extra.catholicChecks ?? {}) as Record<string, boolean>;

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
      comprehensiveExam: requirement.comprehensiveExam,
      substitutionRules: requirement.substitutionRules,
      secondMajor,
      languageScore: extra.languageScore,
      languageExamType: extra.languageExamType,
      languageScorePass,
      thesisPass: extra.thesisPass,
      thesisOptional: requirement.thesisOptional,
      catholicChecks: catholicChecksCatalog.map((c) => {
        const autoDetected =
          c.matchPatterns.length > 0 &&
          resolvedCourses.some((course) => c.matchPatterns.some((pattern) => course.name.includes(pattern)));
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

  private toRequirementView(requirement: CatalogGraduationRequirement) {
    return {
      totalCreditMin: requirement.totalCreditMin,
      creditBreakdownRequired: requirement.creditBreakdown ?? {},
      comprehensiveExam: requirement.comprehensiveExam,
      substitutionRules: requirement.substitutionRules,
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
    ownDeptNames: string[],
  ): Promise<MajorResult | null> {
    if (profile.programType !== 'DOUBLE_MAJOR' || !profile.secondMajorDepartmentId) return null;

    const requirement = await this.findSecondMajorRequirement(profile);
    if (!requirement) {
      return {
        totalCreditMin: null,
        creditBreakdown: [],
        comprehensiveExam: null,
        substitutionRules: [],
        languageScoreStandard: null,
        thesisOptional: false,
      };
    }

    const creditBreakdown = await this.buildCreditBreakdownWithSuggestions(
      profile.secondMajorDepartmentId,
      'SECOND',
      requirement,
      resolvedCourses,
      takenNames,
      ownDeptNames,
    );

    return {
      totalCreditMin: requirement.totalCreditMin,
      creditBreakdown,
      comprehensiveExam: requirement.comprehensiveExam,
      substitutionRules: requirement.substitutionRules,
      languageScoreStandard: requirement.languageScoreStandard,
      thesisOptional: requirement.thesisOptional,
    };
  }

  // 슬롯별로 분리해서 반환한다 — 중핵교양필수 재분류(calculateCreditBreakdown)를 제1/2전공
  // 각각의 breakdown에 적용할 때, 상대 학과가 개설한 과목까지 "본인 전공"으로 잘못 세지 않기 위함
  // (CodeRabbit 리뷰 지적 — 이전엔 두 학과 이름을 합쳐서 양쪽 계산에 그대로 재사용했음).
  private async getOwnDeptNames(profile: Profile): Promise<{ first: string[]; second: string[] }> {
    const [majorDept, secondMajorDept] = await Promise.all([
      this.prisma.department.findUnique({ where: { id: profile.majorDepartmentId } }),
      profile.secondMajorDepartmentId
        ? this.prisma.department.findUnique({ where: { id: profile.secondMajorDepartmentId } })
        : Promise.resolve(null),
    ]);
    return {
      first: majorDept ? [majorDept.name] : [],
      second: secondMajorDept ? [secondMajorDept.name] : [],
    };
  }

  private async buildCreditBreakdownWithSuggestions(
    departmentId: number,
    slot: MajorSlot,
    requirement: CatalogGraduationRequirement,
    courses: ResolvedCourse[],
    takenNames: Set<string>,
    ownDeptNames: string[],
  ): Promise<CreditBreakdownItem[]> {
    const creditBreakdown = this.calculateCreditBreakdown(requirement, courses, slot, ownDeptNames);
    const suggestions = await this.suggestCourses(departmentId, slot, creditBreakdown, takenNames);
    return creditBreakdown.map((item) =>
      item.status === 'fail' ? { ...item, suggestedCourses: suggestions[item.key] ?? null } : item,
    );
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
  private async findRequirement(profile: Profile): Promise<CatalogGraduationRequirement> {
    const requirement = await this.findRequirementForDept(
      profile.majorDepartmentId,
      profile.majorTrackId,
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

  // scope(ALL/FIRST_MAJOR/DOUBLE_MAJOR)와 track을 모두 고려한 공용 조회. 학과가 트랙별로 요건이
  // 갈리면(트랙별 행만 존재) 학생의 트랙과 일치하는 행만, 트랙 구분이 없는 학과(트랙 없는 행만
  // 존재)면 그대로 매치된다 — 두 종류가 한 학과에 섞이지 않는다는 시딩 전제(schema.prisma 주석)를 따른다.
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
          { OR: trackId !== null ? [{ trackId: null }, { trackId }] : [{ trackId: null }] },
        ],
      },
    });
  }

  private async listApplicableCatholicChecks(profile: Profile) {
    const all = await this.prisma.catalogCatholicCheck.findMany({ where: { universityId: profile.universityId } });
    return all.filter((c) => c.admissionYearFrom === null || c.admissionYearFrom <= profile.admissionYear);
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
        category: c.substitution ? c.substitution.category : c.category,
        credit: c.substitution ? c.substitution.credit : c.credit,
        offeringDepartmentName: c.offeringDepartmentName,
        // 요람 코드도 대체인정도 없지만 사용자가 이수구분을 직접 지정한 과목(공유대학 등 요람에
        // 아예 없는 과목)은 그 지정을 신뢰하고 계산을 막지 않는다.
        needsSubstitution: !c.code && !c.substitution && !c.category,
      }));
  }

  private calculateCreditBreakdown(
    requirement: CatalogGraduationRequirement,
    courses: ResolvedCourse[],
    slot: MajorSlot,
    ownDeptNames: string[],
  ): CreditBreakdownItem[] {
    const breakdown = (requirement.creditBreakdown ?? {}) as Record<string, number>;
    if (Object.keys(breakdown).length === 0) return [];

    return Object.entries(breakdown).map(([key, required]) => {
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
      for (const c of courses) {
        if (!c.category) continue;
        // 중핵교양필수를 본인 전공(제1/2전공) 학과가 개설한 경우 전공학점으로 인정되는 경우가 있어
        // (사용자 확인) major 쪽으로 재분류하고 generalCore에선 제외한다.
        const isGeneralCoreOwnMajor =
          c.category === '중핵교양필수' && !!c.offeringDepartmentName && ownDeptNames.includes(c.offeringDepartmentName);

        if (key === 'major' && isGeneralCoreOwnMajor) {
          earned += c.credit;
          continue;
        }
        if (key === 'generalCore' && isGeneralCoreOwnMajor) continue;
        if (categories.includes(c.category)) earned += c.credit;
      }

      return {
        key,
        label: CATEGORY_KEY_LABEL[key] ?? key,
        required,
        earned,
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
