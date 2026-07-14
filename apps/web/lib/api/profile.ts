import { apiFetch } from './client';

export type ProgramType = 'DOUBLE_MAJOR' | 'DEEPENED_MAJOR';

export interface CreateProfileInput {
  admissionYear: number;
  universityId: number;
  majorDepartmentId: number;
  majorTrackId?: number | null;
  programType: ProgramType;
  secondMajorDepartmentId?: number | null;
  secondMajorTrackId?: number | null;
  minorDepartmentId?: number | null;
  hasMicroDegree?: boolean;
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
  majorTrack: { id: number; name: string } | null;
  programType: ProgramType;
  secondMajorDepartment: { id: number; name: string } | null;
  secondMajorTrack: { id: number; name: string } | null;
  minorDepartment: { id: number; name: string } | null;
  hasMicroDegree: boolean;
  syncedAt: string | null;
}

export function getProfile(sessionId: string) {
  return apiFetch<ProfileDetail>('/api/profile', { sessionId });
}
