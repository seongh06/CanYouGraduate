import { apiFetch } from './client';

export interface UpdateCourseInput {
  name?: string;
  category?: string | null;
  credit?: number;
  general?: boolean;
  foreignLanguageType?: string | null;
  crossMajorRecognized?: boolean;
}

// course.service.ts의 MANUAL_FOREIGN_LANGUAGE_LABEL과 동일 — 검증 화면에서 수동으로 켠 외국어강의 표시.
export const MANUAL_FOREIGN_LANGUAGE_LABEL = '수동 지정';

export function updateCourse(sessionId: string, courseId: number, body: UpdateCourseInput) {
  return apiFetch<null>(`/api/courses/${courseId}`, { method: 'PATCH', sessionId, body });
}

export function deleteCourse(sessionId: string, courseId: number) {
  return apiFetch<null>(`/api/courses/${courseId}`, { method: 'DELETE', sessionId });
}

export interface CreateCourseInput {
  semesterLabel: string;
  name: string;
  code?: string | null;
  category?: string | null;
  credit: number;
}

export function createCourse(sessionId: string, body: CreateCourseInput) {
  return apiFetch<{ courseId: number; semesterId: number }>('/api/courses', { method: 'POST', sessionId, body });
}

export function setSubstitution(sessionId: string, courseId: number, catalogCourseId: number) {
  return apiFetch<{ courseId: number; matchedName: string }>(`/api/courses/${courseId}/substitution`, {
    method: 'POST',
    sessionId,
    body: { catalogCourseId },
  });
}

export function removeSubstitution(sessionId: string, courseId: number) {
  return apiFetch<null>(`/api/courses/${courseId}/substitution`, { method: 'DELETE', sessionId });
}
