import { apiFetch } from './client';

export interface CreateProfileInput {
  admissionYear: number;
  universityId: number;
  majorDepartmentId: number;
  minorDepartmentId?: number | null;
  trackId?: number | null;
}

export interface CreateProfileResult {
  sessionId: string;
  profileId: number;
  admissionYear: number;
}

export function createProfile(input: CreateProfileInput) {
  return apiFetch<CreateProfileResult>('/api/profile', { method: 'POST', body: input });
}

export interface ProfileDetail {
  profileId: number;
  admissionYear: number;
  university: { id: number; name: string };
  majorDepartment: { id: number; name: string };
  minorDepartment: { id: number; name: string } | null;
  track: { id: number; name: string } | null;
  syncedAt: string | null;
}

export function getProfile(sessionId: string) {
  return apiFetch<ProfileDetail>('/api/profile', { sessionId });
}
