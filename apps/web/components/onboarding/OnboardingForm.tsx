'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { createProfile } from '../../lib/api/profile';
import { listDepartments, listUniversities } from '../../lib/api/university';
import { ApiError } from '../../lib/api/client';
import { useSession } from '../../lib/session';
import { Card } from '../ui/Card';

export function OnboardingForm() {
  const { setSessionId } = useSession();
  const [admissionYear, setAdmissionYear] = useState('');
  const [universityId, setUniversityId] = useState<number | null>(null);
  const [majorDepartmentId, setMajorDepartmentId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const universitiesQuery = useQuery({ queryKey: ['universities'], queryFn: listUniversities });
  const departmentsQuery = useQuery({
    queryKey: ['departments', universityId],
    queryFn: () => listDepartments(universityId as number),
    enabled: universityId !== null,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      createProfile({
        admissionYear: Number(admissionYear),
        universityId: universityId as number,
        majorDepartmentId: majorDepartmentId as number,
      }),
    onSuccess: (result) => setSessionId(result.sessionId),
    onError: (error) => setErrorMessage(error instanceof ApiError ? error.message : '프로필 등록에 실패했습니다.'),
  });

  const canSubmit = admissionYear.trim() !== '' && universityId !== null && majorDepartmentId !== null;

  return (
    <Card className="mx-auto max-w-md">
      <div className="mb-1 text-[15px] font-bold">시작하기 전에</div>
      <div className="mb-4 text-[13px] text-brand-text-muted">
        학번과 학과 정보를 입력하면 졸업 조건 계산을 시작할 수 있어요.
      </div>

      <label className="mb-3 block text-xs font-bold text-brand-text-muted">
        입학 학번
        <input
          type="number"
          value={admissionYear}
          onChange={(e) => setAdmissionYear(e.target.value)}
          placeholder="예: 2022"
          className="mt-1 h-11 w-full rounded-xl border-[1.5px] border-brand-border bg-[#F8F9FA] px-3 text-sm outline-none"
        />
      </label>

      <label className="mb-3 block text-xs font-bold text-brand-text-muted">
        대학
        <select
          value={universityId ?? ''}
          onChange={(e) => {
            setUniversityId(e.target.value ? Number(e.target.value) : null);
            setMajorDepartmentId(null);
          }}
          className="mt-1 h-11 w-full rounded-xl border-[1.5px] border-brand-border bg-[#F8F9FA] px-3 text-sm outline-none"
        >
          <option value="">선택해주세요</option>
          {universitiesQuery.data?.universities.map((u) => (
            <option key={u.id} value={u.id} disabled={!u.supported}>
              {u.name}
              {!u.supported ? ' (요람 준비중)' : ''}
            </option>
          ))}
        </select>
      </label>

      <label className="mb-4 block text-xs font-bold text-brand-text-muted">
        주전공 학과
        <select
          value={majorDepartmentId ?? ''}
          onChange={(e) => setMajorDepartmentId(e.target.value ? Number(e.target.value) : null)}
          disabled={universityId === null}
          className="mt-1 h-11 w-full rounded-xl border-[1.5px] border-brand-border bg-[#F8F9FA] px-3 text-sm outline-none disabled:opacity-50"
        >
          <option value="">선택해주세요</option>
          {departmentsQuery.data?.departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <button
        onClick={() => submitMutation.mutate()}
        disabled={!canSubmit || submitMutation.isPending}
        className="h-11 w-full rounded-xl bg-brand-blue text-sm font-bold text-white disabled:opacity-50"
      >
        {submitMutation.isPending ? '등록 중...' : '시작하기'}
      </button>

      {errorMessage && <div className="mt-3 text-xs font-semibold text-brand-error">{errorMessage}</div>}
    </Card>
  );
}
