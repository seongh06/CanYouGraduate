'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '../../lib/api/client';
import { createProfile, ProgramType } from '../../lib/api/profile';
import { listDepartments, listUniversities } from '../../lib/api/university';
import { useSession } from '../../lib/session';
import { Card } from '../ui/Card';
import { MajorPicker } from './MajorPicker';

export function OnboardingForm() {
  const { setSessionId } = useSession();
  const [admissionYear, setAdmissionYear] = useState('');
  const [universityId, setUniversityId] = useState<number | null>(null);

  const [majorDepartmentId, setMajorDepartmentId] = useState<number | null>(null);
  const [majorTrackId, setMajorTrackId] = useState<number | null>(null);

  const [programType, setProgramType] = useState<ProgramType>('DEEPENED_MAJOR');

  const [secondMajorDepartmentId, setSecondMajorDepartmentId] = useState<number | null>(null);
  const [secondMajorTrackId, setSecondMajorTrackId] = useState<number | null>(null);

  const [wantsMinor, setWantsMinor] = useState(false);
  const [minorDepartmentId, setMinorDepartmentId] = useState<number | null>(null);

  const [hasMicroDegree, setHasMicroDegree] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const universitiesQuery = useQuery({ queryKey: ['universities'], queryFn: listUniversities });
  const minorDepartmentsQuery = useQuery({
    queryKey: ['departments', universityId, 'all'],
    queryFn: () => listDepartments(universityId as number),
    enabled: wantsMinor && universityId !== null,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      createProfile({
        admissionYear: Number(admissionYear),
        universityId: universityId as number,
        majorDepartmentId: majorDepartmentId as number,
        majorTrackId,
        programType,
        secondMajorDepartmentId: programType === 'DOUBLE_MAJOR' ? secondMajorDepartmentId : null,
        secondMajorTrackId: programType === 'DOUBLE_MAJOR' ? secondMajorTrackId : null,
        minorDepartmentId: wantsMinor ? minorDepartmentId : null,
        hasMicroDegree,
      }),
    onSuccess: (result) => setSessionId(result.sessionId),
    onError: (error) => setErrorMessage(error instanceof ApiError ? error.message : '프로필 등록에 실패했습니다.'),
  });

  const canSubmit =
    admissionYear.trim() !== '' &&
    universityId !== null &&
    majorDepartmentId !== null &&
    (programType === 'DEEPENED_MAJOR' || secondMajorDepartmentId !== null) &&
    (!wantsMinor || minorDepartmentId !== null);

  return (
    <Card className="mx-auto max-w-md">
      <div className="mb-1 text-[15px] font-bold">시작하기 전에</div>
      <div className="mb-4 text-[13px] text-brand-text-muted">
        학번과 전공 정보를 입력하면 졸업 조건 계산을 시작할 수 있어요.
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
            setMajorTrackId(null);
            setSecondMajorDepartmentId(null);
            setSecondMajorTrackId(null);
            setMinorDepartmentId(null);
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

      <div className="mb-1 text-xs font-bold text-brand-text-muted">제1전공</div>
      <MajorPicker
        labelPrefix="제1전공"
        universityId={universityId}
        departmentId={majorDepartmentId}
        trackId={majorTrackId}
        onDepartmentChange={setMajorDepartmentId}
        onTrackChange={setMajorTrackId}
      />

      <div className="mb-1 mt-1 text-xs font-bold text-brand-text-muted">전공 유형</div>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setProgramType('DEEPENED_MAJOR')}
          className={`h-11 flex-1 rounded-xl border-[1.5px] text-sm font-semibold ${
            programType === 'DEEPENED_MAJOR'
              ? 'border-brand-blue bg-[#F0F6FF] text-brand-blue'
              : 'border-brand-border bg-white text-brand-text-muted'
          }`}
        >
          전공심화
        </button>
        <button
          type="button"
          onClick={() => setProgramType('DOUBLE_MAJOR')}
          className={`h-11 flex-1 rounded-xl border-[1.5px] text-sm font-semibold ${
            programType === 'DOUBLE_MAJOR'
              ? 'border-brand-blue bg-[#F0F6FF] text-brand-blue'
              : 'border-brand-border bg-white text-brand-text-muted'
          }`}
        >
          복수전공
        </button>
      </div>

      {programType === 'DOUBLE_MAJOR' && (
        <>
          <div className="mb-1 text-xs font-bold text-brand-text-muted">제2전공(복수전공)</div>
          <MajorPicker
            labelPrefix="제2전공"
            universityId={universityId}
            departmentId={secondMajorDepartmentId}
            trackId={secondMajorTrackId}
            onDepartmentChange={setSecondMajorDepartmentId}
            onTrackChange={setSecondMajorTrackId}
          />
        </>
      )}

      <label className="mb-3 flex items-center gap-2 text-xs font-bold text-brand-text-muted">
        <input
          type="checkbox"
          checked={wantsMinor}
          onChange={(e) => {
            setWantsMinor(e.target.checked);
            if (!e.target.checked) setMinorDepartmentId(null);
          }}
        />
        부전공이 있어요
      </label>

      {wantsMinor && (
        <label className="mb-3 block text-xs font-bold text-brand-text-muted">
          부전공 학과
          <select
            value={minorDepartmentId ?? ''}
            onChange={(e) => setMinorDepartmentId(e.target.value ? Number(e.target.value) : null)}
            disabled={universityId === null}
            className="mt-1 h-11 w-full rounded-xl border-[1.5px] border-brand-border bg-[#F8F9FA] px-3 text-sm outline-none disabled:opacity-50"
          >
            <option value="">선택해주세요</option>
            {minorDepartmentsQuery.data?.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="mb-4 flex items-center gap-2 text-xs font-bold text-brand-text-muted">
        <input type="checkbox" checked={hasMicroDegree} onChange={(e) => setHasMicroDegree(e.target.checked)} />
        소단위전공에 가입되어 있어요
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
