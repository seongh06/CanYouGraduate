'use client';

import type { SemesterItem } from '../../lib/api/everytime';

interface SemesterListProps {
  semesters: SemesterItem[];
  selectedSemesterId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}

export function SemesterList({ semesters, selectedSemesterId, onSelect, onDelete }: SemesterListProps) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-brand-border bg-white p-2.5 sm:flex-col sm:gap-0 sm:overflow-visible sm:rounded-card sm:p-3.5">
      <div className="hidden shrink-0 px-2.5 pb-1.5 pt-2 text-xs font-bold text-brand-text-muted sm:block">
        추출된 학기
      </div>
      {semesters.map((sem) => {
        const selected = sem.id === selectedSemesterId;
        return (
          <div
            key={sem.id}
            onClick={() => onSelect(sem.id)}
            className={`group flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold sm:mb-0.5 sm:justify-between sm:rounded-xl sm:px-2.5 sm:py-2.5 sm:text-[13px] ${
              selected
                ? 'bg-brand-blue text-white sm:bg-[#F0F6FF] sm:text-brand-blue'
                : 'bg-brand-bg text-[#4E5968] sm:bg-transparent'
            }`}
          >
            <span>{sem.label}</span>
            <span className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label={`${sem.label} 삭제`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`${sem.label} 학기를 삭제할까요? 이 학기의 과목이 모두 사라져요.`)) {
                    onDelete(sem.id);
                  }
                }}
                className="rounded-full px-1.5 text-brand-text-muted opacity-60 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                ✕
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
