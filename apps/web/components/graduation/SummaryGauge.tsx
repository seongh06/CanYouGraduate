import { Card } from '../ui/Card';

interface SummaryGaugeProps {
  totalCredits: number;
  totalCreditMin: number | null;
  remainingCredits: number | null;
  completionPercent: number | null;
}

export function SummaryGauge({ totalCredits, totalCreditMin, remainingCredits, completionPercent }: SummaryGaugeProps) {
  return (
    <Card className="mb-4">
      <div className="mb-1 text-[15px] font-bold">졸업 학점 현황</div>
      {totalCreditMin === null ? (
        <div className="text-[13px] text-brand-text-muted">
          이 학과는 졸업 기준 총 학점이 아직 준비되지 않았어요. 현재까지 이수한 학점만 보여드려요.
        </div>
      ) : (
        <>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-brand-bg">
            <div
              className="h-full rounded-full bg-brand-blue transition-all"
              style={{ width: `${Math.min(completionPercent ?? 0, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-brand-text-muted">
            잔여 {remainingCredits}학점 · 이수율 {completionPercent}%
          </div>
        </>
      )}
      <div className="mt-4 flex items-end gap-1.5">
        <span className="text-3xl font-extrabold text-brand-blue">{totalCredits}</span>
        <span className="mb-1 text-sm text-brand-text-muted">
          / {totalCreditMin ?? '?'}학점
        </span>
      </div>
    </Card>
  );
}
