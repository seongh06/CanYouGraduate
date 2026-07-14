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

export function CreditBreakdownList({ items }: { items: CreditBreakdownItem[] }) {
  if (items.length === 0) return null;

  return (
    <Card className="mb-4">
      <div className="mb-3 text-[15px] font-bold">학점 구성</div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-xl bg-brand-bg px-3.5 py-3">
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
        ))}
      </div>
    </Card>
  );
}
