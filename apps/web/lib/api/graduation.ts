import { apiFetch } from './client';

export interface SuggestedCourses {
  first: string[];
  second: string[];
  unknown: string[];
}

export interface CreditBreakdownItem {
  key: string;
  label: string;
  required: number;
  earned: number | null;
  status: 'pass' | 'fail' | 'unavailable';
  note?: string;
  earnedCourses?: string[];
  suggestedCourses?: SuggestedCourses | null;
}

export interface CatholicCheckItem {
  key: string;
  label: string;
  checked: boolean;
  autoDetected: boolean;
}

export interface SubstitutionRule {
  type: string;
  condition: string;
  waives: number | null;
  note?: string;
}

// 대체(택1)가 아니라 전원이 병렬로 모두 충족해야 하는 조건(예: 졸업논문+어학성적+상담 4회를
// 전부 만족해야 하는 경우) — substitutionRules와 구조는 비슷하지만 의미가 다르다.
export interface MandatoryRequirement {
  type: string;
  condition: string;
  note?: string;
}

export interface MajorRequirementView {
  totalCreditMin: number | null;
  comprehensiveExam: Record<string, unknown> | null;
  substitutionRules: SubstitutionRule[];
  mandatoryRequirements: MandatoryRequirement[];
  languageScoreStandard: Record<string, number> | null;
  thesisOptional: boolean;
}

export interface SecondMajorResult extends MajorRequirementView {
  creditBreakdown: CreditBreakdownItem[];
}

export interface SecondMajorRequirements extends MajorRequirementView {
  creditBreakdownRequired: Record<string, number>;
}

export interface CommonLiberalArts {
  basicRequired: number;
  basicEarned: number;
  basicCourses: string[];
  coreRequired: number;
  coreEarned: number;
  coreCourses: string[];
}

export interface MinorCredit {
  requiredCredit: number;
  earnedCredit: number;
}

export interface ForeignLanguageCredits {
  count: number;
  totalCredit: number;
  courses: string[];
}

export interface GraduationResult {
  totalCredits: number;
  totalCreditMin: number | null;
  remainingCredits: number | null;
  completionPercent: number | null;
  creditBreakdown: CreditBreakdownItem[];
  commonLiberalArts: CommonLiberalArts | null;
  minor: MinorCredit | null;
  foreignLanguageCredits: ForeignLanguageCredits;
  comprehensiveExam: Record<string, unknown> | null;
  substitutionRules: SubstitutionRule[];
  mandatoryRequirements: MandatoryRequirement[];
  secondMajor: SecondMajorResult | null;
  languageScore: number | null;
  languageExamType: string | null;
  languageScorePass: boolean | null;
  thesisPass: boolean;
  thesisOptional: boolean;
  catholicChecks: CatholicCheckItem[];
}

export interface GraduationRequirements {
  totalCreditMin: number | null;
  creditBreakdownRequired: Record<string, number>;
  comprehensiveExam: Record<string, unknown> | null;
  substitutionRules: SubstitutionRule[];
  secondMajor: SecondMajorRequirements | null;
  languageScoreStandard: Record<string, number> | null;
  thesisOptional: boolean;
  catholicChecks: Array<{ key: string; label: string }>;
}

// trackId: 결과화면 트랙 미리보기용 — 있으면 프로필 저장값 대신 이 트랙 기준으로 조회한다.
export function getGraduationRequirements(sessionId: string, trackId?: number | null) {
  const query = trackId ? `?trackId=${trackId}` : '';
  return apiFetch<GraduationRequirements>(`/api/graduation/requirements${query}`, { sessionId });
}

export function calculateGraduation(sessionId: string, trackId?: number | null) {
  const query = trackId ? `?trackId=${trackId}` : '';
  return apiFetch<GraduationResult>(`/api/graduation/calculate${query}`, { method: 'POST', sessionId });
}

export function updateCatholicCheck(sessionId: string, checkKey: string, checked: boolean) {
  return apiFetch<null>(`/api/graduation/checks/${checkKey}`, { method: 'PATCH', sessionId, body: { checked } });
}

export function updateLanguageScore(sessionId: string, examType: string, score: number) {
  return apiFetch<{ examType: string; score: number; pass: boolean }>('/api/graduation/language-score', {
    method: 'PATCH',
    sessionId,
    body: { examType, score },
  });
}

export function updateThesis(sessionId: string, pass: boolean) {
  return apiFetch<null>('/api/graduation/thesis', { method: 'PATCH', sessionId, body: { pass } });
}
