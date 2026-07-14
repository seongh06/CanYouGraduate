'use client';

import { useState } from 'react';
import type { CourseItem } from '../../lib/api/everytime';
import { SubstitutionSearch } from './SubstitutionSearch';

interface CourseReviewRowProps {
  course: CourseItem;
  onSetSubstitution: (courseId: number, catalogCourseId: number) => void;
}

export function CourseReviewRow({ course, onSetSubstitution }: CourseReviewRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-brand-bg py-3 first:border-t-0">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[140px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">{course.name}</span>
            {course.needsSubstitution && (
              <span className="rounded-full bg-[#FFF1D6] px-2 py-0.5 text-[10px] font-extrabold text-[#B45309]">
                학과개편 대상
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-brand-text-muted">
            {course.code} · {course.category} · {course.credit}학점
          </div>
        </div>
        {course.substitutionName && (
          <div className="rounded-full bg-[#E7F6EE] px-3 py-1.5 text-xs font-bold text-brand-success">
            ✓ {course.substitutionName}
          </div>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="whitespace-nowrap rounded-[9px] border border-[#DCE7FB] bg-[#F5F8FF] px-3 py-2 text-xs font-bold text-brand-blue"
        >
          대체인정 설정
        </button>
      </div>
      {open && (
        <SubstitutionSearch
          onPick={(catalogCourseId) => {
            onSetSubstitution(course.id, catalogCourseId);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
