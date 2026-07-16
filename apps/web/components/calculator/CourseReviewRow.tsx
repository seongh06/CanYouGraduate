'use client';

import { useState } from 'react';
import { MANUAL_FOREIGN_LANGUAGE_LABEL } from '../../lib/api/courses';
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
  onToggleForeignLanguage: (courseId: number, checked: boolean) => void;
  onToggleCrossMajorRecognition: (courseId: number, checked: boolean) => void;
}

export function CourseReviewRow({
  course,
  onSetSubstitution,
  onManualCategory,
  onToggleForeignLanguage,
  onToggleCrossMajorRecognition,
}: CourseReviewRowProps) {
  // 요람 코드도 대체인정도 없지만 이수구분은 직접 지정된 상태 — 공유대학 등 요람 밖 과목을
  // "직접 입력하기"로 저장하고 나면 이 상태가 된다(needsSubstitution은 false로 바뀜).
  const isManuallyCategorized = !course.code && !course.substitutionName && !!course.category;
  const [open, setOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCategory, setManualCategory] = useState(
    course.category && (MANUAL_CATEGORY_OPTIONS as string[]).includes(course.category)
      ? course.category
      : MANUAL_CATEGORY_OPTIONS[0],
  );
  const [manualCredit, setManualCredit] = useState(String(course.credit || 3));

  return (
    <div className="border-t border-brand-bg py-3 first:border-t-0">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[140px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">{course.name}</span>
            {course.isSharedUniversity && (
              <span className="rounded-full bg-[#EAF2FF] px-2 py-0.5 text-[10px] font-extrabold text-brand-blue">
                🏫 공유대학
              </span>
            )}
            {course.needsSubstitution && !course.isSharedUniversity && (
              <span className="rounded-full bg-[#FFF1D6] px-2 py-0.5 text-[10px] font-extrabold text-[#B45309]">
                학과개편 대상
              </span>
            )}
            {isManuallyCategorized && !course.isSharedUniversity && (
              <span className="rounded-full bg-[#EAF2FF] px-2 py-0.5 text-[10px] font-extrabold text-brand-blue">
                직접 입력됨(공유대학 등)
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
        {course.foreignLanguageType && (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-[#EFF6FF] px-[9px] py-1 text-[11px] font-bold text-brand-blue">
            🌐 외국어강의
            {course.foreignLanguageType !== MANUAL_FOREIGN_LANGUAGE_LABEL && (
              <span className="ml-1 font-normal text-brand-text-muted">(자동감지)</span>
            )}
          </span>
        )}
        {course.crossMajorRecognized && (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-[#E7F6EE] px-[9px] py-1 text-[11px] font-bold text-brand-success">
            🎓 타전공학점 인정됨
          </span>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="whitespace-nowrap rounded-[9px] border border-[#DCE7FB] bg-[#F5F8FF] px-3 py-2 text-xs font-bold text-brand-blue"
        >
          설정
        </button>
      </div>
      {open && (
        <>
          <label className="mt-2 flex w-fit cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[9px] border border-[#DCE7FB] bg-[#F5F8FF] px-3 py-2 text-xs font-bold text-brand-blue">
            <input
              type="checkbox"
              checked={!!course.foreignLanguageType}
              onChange={(e) => onToggleForeignLanguage(course.id, e.target.checked)}
              className="h-3.5 w-3.5 accent-brand-blue"
            />
            🌐 외국어강의로 표시
          </label>
          {(course.category === '타전공선택' || course.crossMajorRecognized) && (
            <label className="mt-2 flex w-fit cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[9px] border border-[#D6EEDD] bg-[#F2FBF5] px-3 py-2 text-xs font-bold text-brand-success">
              <input
                type="checkbox"
                checked={course.crossMajorRecognized}
                onChange={(e) => onToggleCrossMajorRecognition(course.id, e.target.checked)}
                className="h-3.5 w-3.5 accent-brand-success"
              />
              🎓 타전공이지만 내 전공학점으로 인정돼요
            </label>
          )}
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
                min="0"
                step="1"
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
