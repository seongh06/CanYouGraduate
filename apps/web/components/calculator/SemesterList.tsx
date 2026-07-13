'use client';

import type { SemesterItem } from '../../lib/api/everytime';

interface SemesterListProps {
  semesters: SemesterItem[];
  selectedSemesterId: number | null;
  onSelect: (id: number) => void;
}

export function SemesterList({ semesters, selectedSemesterId, onSelect }: SemesterListProps) {
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
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold sm:mb-0.5 sm:justify-between sm:rounded-xl sm:px-2.5 sm:py-2.5 sm:text-[13px] ${
              selected
                ? 'bg-brand-blue text-white sm:bg-[#F0F6FF] sm:text-brand-blue'
                : 'bg-brand-bg text-[#4E5968] sm:bg-transparent'
            }`}
          >
            <span>{sem.label}</span>
            {sem.active && (
              <span className="rounded-full bg-[#E8F1FF] px-[7px] py-0.5 text-[10px] font-extrabold text-brand-blue">
                Active
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
