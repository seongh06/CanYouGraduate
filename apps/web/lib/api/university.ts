import { apiFetch } from './client';

export interface UniversityItem {
  id: number;
  name: string;
  supported: boolean;
}

export interface CollegeItem {
  id: number;
  name: string;
  campus: string;
}

export interface DepartmentItem {
  id: number;
  name: string;
  catalogReady: boolean;
  collegeId: number | null;
  collegeName: string;
}

export interface TrackItem {
  id: number;
  name: string;
  requiredCourseCount: number | null;
}

export function listUniversities() {
  return apiFetch<{ universities: UniversityItem[] }>('/api/universities');
}

export function listColleges(universityId: number) {
  return apiFetch<{ colleges: CollegeItem[] }>(`/api/colleges?universityId=${universityId}`);
}

export function listDepartments(universityId: number, collegeId?: number) {
  const params = new URLSearchParams({ universityId: String(universityId) });
  if (collegeId !== undefined) params.set('collegeId', String(collegeId));
  return apiFetch<{ departments: DepartmentItem[] }>(`/api/departments?${params.toString()}`);
}

export function listTracks(departmentId: number) {
  return apiFetch<{ tracks: TrackItem[] }>(`/api/departments/${departmentId}/tracks`);
}
