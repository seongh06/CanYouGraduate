import type { CatholicCheckItem } from '../../lib/api/graduation';
import { Card } from '../ui/Card';

interface CatholicChecklistProps {
  checks: CatholicCheckItem[];
  onToggle: (key: string, checked: boolean) => void;
}

export function CatholicChecklist({ checks, onToggle }: CatholicChecklistProps) {
  return (
    <Card className="mb-4">
      <div className="mb-3 text-[15px] font-bold">가톨릭대 특화 졸업 조건</div>
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
          </label>
        ))}
      </div>
    </Card>
  );
}
