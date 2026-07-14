import { apiFetch } from './client';

export interface UpdateCourseInput {
  name?: string;
  category?: string | null;
  credit?: number;
  general?: boolean;
}

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
