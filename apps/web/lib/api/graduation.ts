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

export interface MajorRequirementView {
  totalCreditMin: number | null;
  comprehensiveExam: Record<string, unknown> | null;
  substitutionRules: SubstitutionRule[];
  languageScoreStandard: Record<string, number> | null;
  thesisOptional: boolean;
}

export interface SecondMajorResult extends MajorRequirementView {
  creditBreakdown: CreditBreakdownItem[];
}

export interface SecondMajorRequirements extends MajorRequirementView {
  creditBreakdownRequired: Record<string, number>;
}

export interface GraduationResult {
  totalCredits: number;
  totalCreditMin: number | null;
  remainingCredits: number | null;
  completionPercent: number | null;
  creditBreakdown: CreditBreakdownItem[];
  comprehensiveExam: Record<string, unknown> | null;
  substitutionRules: SubstitutionRule[];
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
