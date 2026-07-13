'use client';

import { useState } from 'react';
import type { CourseItem } from '../../lib/api/everytime';
import { Card } from '../ui/Card';

interface FilteredSchedulePanelProps {
  courses: CourseItem[];
  onAddBack: (courseId: number) => void;
  onDelete: (courseId: number) => void;
}

export function FilteredSchedulePanel({ courses, onAddBack, onDelete }: FilteredSchedulePanelProps) {
  const [open, setOpen] = useState(false);
  const filtered = courses.filter((c) => c.general);

  return (
    <Card>
      <div className="flex cursor-pointer items-center justify-between" onClick={() => setOpen((v) => !v)}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold">일반 일정 필터링됨</span>
          <span className="rounded-full bg-brand-bg px-2 py-0.5 text-[11px] font-bold text-brand-text-muted">
            {filtered.length}건
          </span>
        </div>
        <span className="text-xs text-brand-text-muted">{open ? '접기 ▲' : '펼치기 ▼'}</span>
      </div>
      {open && (
        <div className="mt-3.5 flex flex-col gap-2">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-2.5 rounded-xl border border-dashed border-brand-border bg-[#FAFBFC] px-3 py-2.5 opacity-65"
            >
              <div className="min-w-[80px] flex-1 text-[13px] font-semibold">{c.name}</div>
              <span className="rounded-full bg-[#EAECEF] px-2 py-1 text-[11px] font-bold text-brand-text-muted">
                과목코드 없음
              </span>
              <button
                onClick={() => onAddBack(c.id)}
                className="rounded-lg border border-[#DCE7FB] bg-white px-2.5 py-1.5 text-xs font-bold text-brand-blue"
              >
                과목으로 추가
              </button>
              <button
                onClick={() => onDelete(c.id)}
                className="rounded-lg border border-[#FBDCDD] bg-white px-2.5 py-1.5 text-xs font-bold text-brand-error"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
