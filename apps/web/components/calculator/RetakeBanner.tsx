'use client';

import type { DuplicateGroup } from '../../lib/api/duplicates';

interface RetakeBannerProps {
  groups: DuplicateGroup[];
  semesterLabelsByCourseId: Map<number, string>;
  onToggle: (groupKey: string, retakeAccepted: boolean) => void;
}

export function RetakeBanner({ groups, semesterLabelsByCourseId, onToggle }: RetakeBannerProps) {
  if (groups.length === 0) return null;

  return (
    <div className="mb-4 rounded-[18px] border border-[#FFE0B8] bg-[#FFF7ED] px-5 py-4 sm:px-[22px]">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-lg">⚠️</span>
        <div className="text-sm font-extrabold text-[#B45309]">중복 수강이 감지되었습니다. 재수강 처리하시겠습니까?</div>
      </div>
      {groups.map((g) => {
        const semLabels = [...new Set(g.courseIds.map((id) => semesterLabelsByCourseId.get(id)).filter(Boolean))].join(
          ' · ',
        );
        return (
          <div
            key={g.groupKey}
            className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 last:mb-0"
          >
            <div>
              <div className="text-[13px] font-bold">{g.name}</div>
              <div className="mt-0.5 text-xs text-brand-text-muted">
                {semLabels} · 총 {g.courseIds.length}회 수강
              </div>
            </div>
            <div
              onClick={() => onToggle(g.groupKey, !g.retakeAccepted)}
              className={`h-[26px] w-11 shrink-0 cursor-pointer rounded-full p-[3px] transition-colors ${
                g.retakeAccepted ? 'bg-brand-blue' : 'bg-brand-border'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  g.retakeAccepted ? 'translate-x-[18px]' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
