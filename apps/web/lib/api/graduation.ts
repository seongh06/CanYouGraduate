import { apiFetch } from './client';

export interface CreditBreakdownItem {
  key: string;
  label: string;
  required: number;
  earned: number | null;
  status: 'pass' | 'fail' | 'unavailable';
  note?: string;
}

export interface CatholicCheckItem {
  key: string;
  label: string;
  checked: boolean;
}

export interface GraduationResult {
  totalCredits: number;
  totalCreditMin: number | null;
  remainingCredits: number | null;
  completionPercent: number | null;
  creditBreakdown: CreditBreakdownItem[];
  comprehensiveExam: Record<string, unknown> | null;
  substitutionRules: Array<{ type: string; condition: string; waives: number | null; note?: string }>;
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
  substitutionRules: Array<{ type: string; condition: string; waives: number | null; note?: string }>;
  languageScoreStandard: Record<string, number> | null;
  thesisOptional: boolean;
  catholicChecks: Array<{ key: string; label: string }>;
}

export function getGraduationRequirements(sessionId: string) {
  return apiFetch<GraduationRequirements>('/api/graduation/requirements', { sessionId });
}

export function calculateGraduation(sessionId: string) {
  return apiFetch<GraduationResult>('/api/graduation/calculate', { method: 'POST', sessionId });
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
