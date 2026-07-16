import { apiFetch } from './client';

export interface SemesterItem {
  id: number;
  label: string;
  active: boolean;
  courseCount: number;
}

export interface CourseItem {
  id: number;
  name: string;
  code: string | null;
  category: string | null;
  credit: number;
  general: boolean;
  foreignLanguageType: string | null;
  offeringDepartmentName: string | null;
  isDuplicate: boolean;
  needsSubstitution: boolean;
  substitutionName: string | null;
  crossMajorRecognized: boolean;
  crossMajorEligible: boolean;
  isOnline: boolean;
  isSharedUniversity: boolean;
}

export function syncEverytime(sessionId: string, url: string) {
  return apiFetch<{ jobId: string; status: 'PENDING' }>('/api/everytime/sync', {
    method: 'POST',
    sessionId,
    body: { url },
  });
}

export function syncEverytimeText(sessionId: string, semesterLabel: string, rawText: string) {
  return apiFetch<{ semesterId: number; parsedCourseCount: number; unparsedLineCount: number }>(
    '/api/everytime/sync/text',
    { method: 'POST', sessionId, body: { semesterLabel, rawText } },
  );
}

export function listSemesters(sessionId: string) {
  return apiFetch<{ semesters: SemesterItem[] }>('/api/everytime/semesters', { sessionId });
}

export function listCourses(sessionId: string, semesterId: number, includeGeneral = true) {
  return apiFetch<{ courses: CourseItem[] }>(
    `/api/everytime/semesters/${semesterId}/courses?includeGeneral=${includeGeneral}`,
    { sessionId },
  );
}

export function deleteSemester(sessionId: string, semesterId: number) {
  return apiFetch<null>(`/api/everytime/semesters/${semesterId}`, { method: 'DELETE', sessionId });
}
