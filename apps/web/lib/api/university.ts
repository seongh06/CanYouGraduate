import { apiFetch } from './client';

export interface UniversityItem {
  id: number;
  name: string;
  supported: boolean;
}

export interface DepartmentItem {
  id: number;
  name: string;
  catalogReady: boolean;
}

export interface TrackItem {
  id: number;
  name: string;
  requiredCourseCount: number;
}

export function listUniversities() {
  return apiFetch<{ universities: UniversityItem[] }>('/api/universities');
}

export function listDepartments(universityId: number) {
  return apiFetch<{ departments: DepartmentItem[] }>(`/api/departments?universityId=${universityId}`);
}

export function listTracks(departmentId: number) {
  return apiFetch<{ tracks: TrackItem[] }>(`/api/departments/${departmentId}/tracks`);
}
