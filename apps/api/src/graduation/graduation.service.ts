import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CatalogGraduationRequirement, Profile } from '@prisma/client';
import { groupDuplicateCourses } from '../common/retake-grouping.util';
import { PrismaService } from '../prisma/prisma.service';
import { CATEGORY_KEY_LABEL, CATEGORY_KEY_MAP } from './category-key-map';

interface ResolvedCourse {
  category: string | null;
  credit: number;
  offeringDepartmentName: string | null;
  needsSubstitution: boolean;
}

type CreditBreakdownItem =
  | { key: string; label: string; required: number; earned: number; status: 'pass' | 'fail' }
  | { key: string; label: string; required: number; earned: null; status: 'unavailable'; note: string };

@Injectable()
export class GraduationService {
  constructor(private readonly prisma: PrismaService) {}

  async getRequirements(profile: Profile) {
    const requirement = await this.findRequirement(profile);
    const catholicChecks = await this.prisma.catalogCatholicCheck.findMany({
      where: { universityId: profile.universityId },
    });

    return {
      totalCreditMin: requirement.totalCreditMin,
      creditBreakdownRequired: requirement.creditBreakdown ?? {},
      comprehensiveExam: requirement.comprehensiveExam,
      substitutionRules: requirement.substitutionRules,
      languageScoreStandard: requirement.languageScoreStandard,
      thesisOptional: requirement.thesisOptional,
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

    const creditBreakdown = await this.calculateCreditBreakdown(profile, requirement, resolvedCourses);

    const extra = await this.getOrCreateExtra(profile.id);
    const catholicChecksCatalog = await this.prisma.catalogCatholicCheck.findMany({
      where: { universityId: profile.universityId },
    });
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
      languageScore: extra.languageScore,
      languageExamType: extra.languageExamType,
      languageScorePass,
      thesisPass: extra.thesisPass,
      thesisOptional: requirement.thesisOptional,
      catholicChecks: catholicChecksCatalog.map((c) => ({
        key: c.key,
        label: c.label,
        checked: checkedMap[c.key] ?? false,
      })),
    };
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

  private async findRequirement(profile: Profile): Promise<CatalogGraduationRequirement> {
    const requirement = await this.prisma.catalogGraduationRequirement.findFirst({
      where: {
        departmentId: profile.majorDepartmentId,
        admissionYearFrom: { lte: profile.admissionYear },
        OR: [{ admissionYearTo: null }, { admissionYearTo: { gte: profile.admissionYear } }],
      },
    });
    if (!requirement) {
      throw new NotFoundException('아직 해당 학과의 요람 데이터가 준비되지 않았습니다.');
    }
    return requirement;
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
        category: c.substitution ? c.substitution.category : c.category,
        credit: c.substitution ? c.substitution.credit : c.credit,
        offeringDepartmentName: c.offeringDepartmentName,
        needsSubstitution: !c.code && !c.substitution,
      }));
  }

  private async calculateCreditBreakdown(
    profile: Profile,
    requirement: CatalogGraduationRequirement,
    courses: ResolvedCourse[],
  ): Promise<CreditBreakdownItem[]> {
    const breakdown = (requirement.creditBreakdown ?? {}) as Record<string, number>;
    if (Object.keys(breakdown).length === 0) return [];

    const [majorDept, secondMajorDept] = await Promise.all([
      this.prisma.department.findUnique({ where: { id: profile.majorDepartmentId } }),
      profile.secondMajorDepartmentId
        ? this.prisma.department.findUnique({ where: { id: profile.secondMajorDepartmentId } })
        : Promise.resolve(null),
    ]);
    const ownDeptNames = [majorDept?.name, secondMajorDept?.name].filter((n): n is string => !!n);

    return Object.entries(breakdown).map(([key, required]) => {
      const categories = CATEGORY_KEY_MAP[key];
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

  private async getOrCreateExtra(profileId: number) {
    const existing = await this.prisma.graduationExtra.findUnique({ where: { profileId } });
    if (existing) return existing;
    return this.prisma.graduationExtra.create({ data: { profileId } });
  }
}
