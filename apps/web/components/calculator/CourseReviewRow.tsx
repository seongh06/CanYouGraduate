'use client';

import { useState } from 'react';
import type { CourseItem } from '../../lib/api/everytime';
import { SubstitutionSearch } from './SubstitutionSearch';

const MANUAL_CATEGORY_OPTIONS = [
  '제1전공필수',
  '제1전공선택',
  '제2전공필수',
  '제2전공선택',
  '전공기초',
  '기초교양필수',
  '중핵교양필수',
  '자유선택교양',
];

interface CourseReviewRowProps {
  course: CourseItem;
  onSetSubstitution: (courseId: number, catalogCourseId: number) => void;
  onManualCategory: (courseId: number, input: { category: string; credit: number }) => void;
}

export function CourseReviewRow({ course, onSetSubstitution, onManualCategory }: CourseReviewRowProps) {
  const [open, setOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCategory, setManualCategory] = useState(MANUAL_CATEGORY_OPTIONS[0]);
  const [manualCredit, setManualCredit] = useState(String(course.credit || 3));

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
        <>
          <SubstitutionSearch
            onPick={(catalogCourseId) => {
              onSetSubstitution(course.id, catalogCourseId);
              setOpen(false);
            }}
          />
          {!manualOpen ? (
            <button
              onClick={() => setManualOpen(true)}
              className="mt-2 text-xs font-bold text-brand-text-muted underline"
            >
              요람에 없는 과목인가요? (공유대학 등) 이수구분 직접 입력하기
            </button>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-brand-border bg-[#F8F9FA] p-3">
              <select
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                className="h-9 rounded-lg border-[1.5px] border-brand-border bg-white px-2.5 text-xs outline-none"
              >
                {MANUAL_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={manualCredit}
                onChange={(e) => setManualCredit(e.target.value)}
                placeholder="학점"
                className="h-9 w-16 rounded-lg border-[1.5px] border-brand-border bg-white px-2.5 text-xs outline-none"
              />
              <button
                onClick={() => {
                  const n = Number(manualCredit);
                  if (!Number.isInteger(n) || n < 0) return;
                  onManualCategory(course.id, { category: manualCategory, credit: n });
                  setManualOpen(false);
                  setOpen(false);
                }}
                className="h-9 rounded-lg bg-brand-blue px-3 text-xs font-bold text-white"
              >
                저장
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
