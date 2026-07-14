'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listDepartments, listTracks } from '../../lib/api/university';

interface MajorPickerProps {
  labelPrefix: string;
  universityId: number | null;
  departmentId: number | null;
  trackId: number | null;
  onDepartmentChange: (departmentId: number | null) => void;
  onTrackChange: (trackId: number | null) => void;
}

export function MajorPicker({
  labelPrefix,
  universityId,
  departmentId,
  trackId,
  onDepartmentChange,
  onTrackChange,
}: MajorPickerProps) {
  const departmentsQuery = useQuery({
    queryKey: ['departments', universityId, 'all'],
    queryFn: () => listDepartments(universityId as number),
    enabled: universityId !== null,
  });

  const departmentsByCollege = useMemo(() => {
    const departments = departmentsQuery.data?.departments ?? [];
    const groups = new Map<string, typeof departments>();
    for (const d of departments) {
      const list = groups.get(d.collegeName) ?? [];
      list.push(d);
      groups.set(d.collegeName, list);
    }
    return Array.from(groups.entries());
  }, [departmentsQuery.data]);

  const tracksQuery = useQuery({
    queryKey: ['tracks', departmentId],
    queryFn: () => listTracks(departmentId as number),
    enabled: departmentId !== null,
  });

  const tracks = tracksQuery.data?.tracks ?? [];

  return (
    <div className="mb-3 flex flex-col gap-3">
      <label className="block text-xs font-bold text-brand-text-muted">
        {labelPrefix} 학과
        <select
          value={departmentId ?? ''}
          onChange={(e) => {
            onDepartmentChange(e.target.value ? Number(e.target.value) : null);
            onTrackChange(null);
          }}
          disabled={universityId === null}
          className="mt-1 h-11 w-full rounded-xl border-[1.5px] border-brand-border bg-[#F8F9FA] px-3 text-sm outline-none disabled:opacity-50"
        >
          <option value="">선택해주세요</option>
          {departmentsByCollege.map(([collegeName, departments]) => (
            <optgroup key={collegeName} label={collegeName}>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      {tracks.length > 0 && (
        <label className="block text-xs font-bold text-brand-text-muted">
          {labelPrefix} 트랙 (선택)
          <select
            value={trackId ?? ''}
            onChange={(e) => onTrackChange(e.target.value ? Number(e.target.value) : null)}
            className="mt-1 h-11 w-full rounded-xl border-[1.5px] border-brand-border bg-[#F8F9FA] px-3 text-sm outline-none"
          >
            <option value="">선택 안 함</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
