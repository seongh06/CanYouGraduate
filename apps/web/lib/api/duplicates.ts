import { apiFetch } from './client';

export interface DuplicateGroup {
  groupKey: string;
  name: string;
  courseIds: number[];
  retakeAccepted: boolean;
}

export function listDuplicates(sessionId: string) {
  return apiFetch<{ duplicateGroups: DuplicateGroup[] }>('/api/courses/duplicates', { sessionId });
}

export function toggleRetake(sessionId: string, groupKey: string, retakeAccepted: boolean) {
  return apiFetch<null>(`/api/courses/duplicates/${encodeURIComponent(groupKey)}/retake`, {
    method: 'PATCH',
    sessionId,
    body: { retakeAccepted },
  });
}
