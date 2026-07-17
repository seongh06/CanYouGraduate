'use client';

import { useState } from 'react';
import { Card } from '../ui/Card';

interface LanguageAndThesisCardProps {
  languageScoreStandard: Record<string, number> | null;
  languageScore: number | null;
  languageExamType: string | null;
  languageScorePass: boolean | null;
  thesisPass: boolean;
  thesisOptional: boolean;
  // 졸업시험이 폐지·미실시(hasExam:'N')이고 논문도 선택이면 자기신고할 게 아무것도 없어서
  // 이 카드의 졸업논문/시험 섹션 자체가 무의미하다 — 그 경우만 false로 넘겨서 숨긴다.
  showThesisSection: boolean;
  onSubmitLanguageScore: (examType: string, score: number) => void;
  onToggleThesis: (pass: boolean) => void;
}

export function LanguageAndThesisCard({
  languageScoreStandard,
  languageScore,
  languageExamType,
  languageScorePass,
  thesisPass,
  thesisOptional,
  showThesisSection,
  onSubmitLanguageScore,
  onToggleThesis,
}: LanguageAndThesisCardProps) {
  const examTypes = languageScoreStandard ? Object.keys(languageScoreStandard) : [];
  const [examType, setExamType] = useState(languageExamType ?? examTypes[0] ?? '');
  const [score, setScore] = useState(languageScore !== null ? String(languageScore) : '');

  if (examTypes.length === 0 && !showThesisSection) return null;

  return (
    <Card className="mb-4">
      {examTypes.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 text-[15px] font-bold">공인 어학성적</div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="h-10 rounded-xl border-[1.5px] border-brand-border bg-[#F8F9FA] px-3 text-sm outline-none"
            >
              {examTypes.map((t) => (
                <option key={t} value={t}>
                  {t} (기준 {languageScoreStandard![t]})
                </option>
              ))}
            </select>
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="점수"
              className="h-10 w-28 rounded-xl border-[1.5px] border-brand-border bg-[#F8F9FA] px-3 text-sm outline-none"
            />
            <button
              onClick={() => {
                const n = Number(score);
                if (examType && Number.isFinite(n) && n >= 0) onSubmitLanguageScore(examType, n);
              }}
              className="h-10 rounded-xl bg-brand-blue px-4 text-xs font-bold text-white"
            >
              저장
            </button>
            {languageScorePass !== null && (
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  languageScorePass ? 'bg-[#E7F6EE] text-brand-success' : 'bg-[#FDECEC] text-brand-error'
                }`}
              >
                {languageScorePass ? '기준 충족' : '기준 미달'}
              </span>
            )}
          </div>
        </div>
      )}

      {showThesisSection && (
        <div>
          <div className="mb-1 text-[15px] font-bold">
            졸업논문 / 졸업시험{thesisOptional ? ' (선택)' : ''}
          </div>
          <div className="mb-2 text-xs text-brand-text-muted">
            자동으로 판정할 수 없는 항목이에요 — 학과에서 통과 처리됐는지 직접 확인 후 체크해주세요.
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-brand-bg px-3.5 py-3">
            <input
              type="checkbox"
              checked={thesisPass}
              onChange={(e) => onToggleThesis(e.target.checked)}
              className="h-4 w-4 accent-brand-blue"
            />
            <span className="text-[13px] font-semibold">직접 확인했고, 통과했어요</span>
          </label>
        </div>
      )}
    </Card>
  );
}
