'use client';

import { useState } from 'react';
import type { CourseItem } from '../../lib/api/everytime';
import { Card } from '../ui/Card';

const CATEGORY_OPTIONS = [
  '제1전공필수',
  '제1전공선택',
  '제2전공필수',
  '제2전공선택',
  '전공기초',
  '기초교양필수',
  '중핵교양필수',
  '자유선택교양',
];

interface FilteredSchedulePanelProps {
  courses: CourseItem[];
  onAddBack: (courseId: number, input: { category: string; credit: number }) => void;
  onDelete: (courseId: number) => void;
}

export function FilteredSchedulePanel({ courses, onAddBack, onDelete }: FilteredSchedulePanelProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [credit, setCredit] = useState('3');
  const filtered = courses.filter((c) => c.general);

  const startEdit = (id: number) => {
    setEditingId(id);
    setCategory(CATEGORY_OPTIONS[0]);
    setCredit('3');
  };

  const confirmAdd = (id: number) => {
    const n = Number(credit);
    if (!Number.isInteger(n) || n < 0) return;
    onAddBack(id, { category, credit: n });
    setEditingId(null);
  };

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
          <div className="text-xs text-brand-text-muted">
            공유대학 과목처럼 과목코드가 없는 항목은 이수구분·학점을 직접 지정해서 추가할 수 있어요.
          </div>
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-2 rounded-xl border border-dashed border-brand-border bg-[#FAFBFC] px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="min-w-[80px] flex-1 text-[13px] font-semibold">{c.name}</div>
                {c.code ? (
                  <span className="rounded-full bg-[#EAECEF] px-2 py-1 text-[11px] font-bold text-brand-text-muted">
                    {c.code} · {c.category}
                  </span>
                ) : (
                  <span className="rounded-full bg-[#EAECEF] px-2 py-1 text-[11px] font-bold text-brand-text-muted">
                    과목코드 없음
                  </span>
                )}
                <button
                  onClick={() => (editingId === c.id ? setEditingId(null) : startEdit(c.id))}
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
              {editingId === c.id && (
                <div className="flex flex-wrap items-center gap-2 border-t border-brand-border pt-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-9 rounded-lg border-[1.5px] border-brand-border bg-white px-2 text-xs outline-none"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={credit}
                    onChange={(e) => setCredit(e.target.value)}
                    placeholder="학점"
                    className="h-9 w-16 rounded-lg border-[1.5px] border-brand-border bg-white px-2 text-xs outline-none"
                  />
                  <button
                    onClick={() => confirmAdd(c.id)}
                    className="h-9 rounded-lg bg-brand-blue px-3 text-xs font-bold text-white"
                  >
                    확인
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
