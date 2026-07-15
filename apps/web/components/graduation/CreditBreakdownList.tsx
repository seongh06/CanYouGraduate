'use client';

import { useState } from 'react';
import type { CreditBreakdownItem } from '../../lib/api/graduation';
import { Card } from '../ui/Card';

const STATUS_STYLE: Record<CreditBreakdownItem['status'], string> = {
  pass: 'bg-[#E7F6EE] text-brand-success',
  fail: 'bg-[#FDECEC] text-brand-error',
  unavailable: 'bg-[#EAECEF] text-brand-text-muted',
};

const STATUS_LABEL: Record<CreditBreakdownItem['status'], string> = {
  pass: '충족',
  fail: '미충족',
  unavailable: '정보',
};

function SuggestedCoursesBlock({ items }: { items: NonNullable<CreditBreakdownItem['suggestedCourses']> }) {
  const groups: Array<[string, string[]]> = [
    ['1학기', items.first],
    ['2학기', items.second],
    ['학기 미확인', items.unknown],
  ].filter(([, list]) => list.length > 0) as Array<[string, string[]]>;

  if (groups.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-dashed border-brand-border bg-white px-3 py-2.5">
      <div className="mb-1.5 text-[11px] text-brand-text-muted">
        재작년·작년 개설 이력 기준 추천이에요. 실제로 이번 학기에 열리지 않을 수 있어요.
      </div>
      <div className="flex flex-col gap-1">
        {groups.map(([label, list]) => (
          <div key={label} className="text-xs">
            <span className="font-bold">{label}:</span> <span className="text-brand-text-muted">{list.join(', ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CreditBreakdownList({ items }: { items: CreditBreakdownItem[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <Card className="mb-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between">
        <span className="text-[15px] font-bold">학점 구성</span>
        <span className="text-xs font-bold text-brand-blue">{open ? '접기 ▲' : '펼치기 ▼'}</span>
      </button>
      {open && (
      <div className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.key} className="rounded-xl bg-brand-bg px-3.5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-bold">{item.label}</div>
                <div className="mt-0.5 text-xs text-brand-text-muted">
                  {item.status === 'unavailable'
                    ? item.note
                    : `${item.earned} / ${item.required}학점`}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[item.status]}`}>
                {STATUS_LABEL[item.status]}
              </span>
            </div>
            {item.status === 'fail' && item.suggestedCourses && <SuggestedCoursesBlock items={item.suggestedCourses} />}
          </div>
        ))}
      </div>
      )}
    </Card>
  );
}
