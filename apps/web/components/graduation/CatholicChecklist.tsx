'use client';

import { useState } from 'react';
import type { CatholicCheckItem } from '../../lib/api/graduation';
import { Card } from '../ui/Card';

interface CatholicChecklistProps {
  checks: CatholicCheckItem[];
  onToggle: (key: string, checked: boolean) => void;
}

export function CatholicChecklist({ checks, onToggle }: CatholicChecklistProps) {
  const [open, setOpen] = useState(false);
  if (checks.length === 0) return null;

  return (
    <Card className="mb-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between">
        <span className="text-[15px] font-bold">공통 졸업 조건</span>
        <span className="text-xs font-bold text-brand-blue">{open ? '접기 ▲' : '펼치기 ▼'}</span>
      </button>
      {open && (
        <>
          <div className="mb-3 mt-3 text-xs text-brand-text-muted">
            시간표에서 이미 들은 과목은 자동으로 체크돼요 — 틀렸다면 직접 눌러서 바꿀 수 있어요.
          </div>
          <div className="flex flex-col gap-2">
            {checks.map((c) => (
              <label key={c.key} className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-brand-bg px-3.5 py-3">
                <input
                  type="checkbox"
                  checked={c.checked}
                  onChange={(e) => onToggle(c.key, e.target.checked)}
                  className="h-4 w-4 accent-brand-blue"
                />
                <span className="text-[13px] font-semibold">{c.label}</span>
                {c.autoDetected && (
                  <span className="rounded-full bg-[#E7F6EE] px-2 py-0.5 text-[10px] font-bold text-brand-success">
                    자동 감지됨
                  </span>
                )}
              </label>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
