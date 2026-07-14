'use client';

interface StepPillsProps {
  step: 1 | 2 | 3;
  onGoToStep: (n: 1 | 2 | 3) => void;
  canGoToStep: (n: 1 | 2 | 3) => boolean;
}

const STEP_TITLES: { n: 1 | 2 | 3; title: string }[] = [
  { n: 1, title: '데이터 입력' },
  { n: 2, title: '검증 & 설정' },
  { n: 3, title: '결과 대시보드' },
];

export function StepPills({ step, onGoToStep, canGoToStep }: StepPillsProps) {
  return (
    <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-brand-border bg-white p-1.5 shadow-sm sm:gap-2">
      {STEP_TITLES.map(({ n, title }) => {
        const active = n === step;
        const done = n < step;
        const clickable = canGoToStep(n);

        return (
          <div
            key={n}
            onClick={() => clickable && onGoToStep(n)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1.5 sm:px-4 ${
              clickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
            } ${active ? 'bg-brand-text' : ''}`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                active
                  ? 'bg-brand-blue text-white'
                  : done
                    ? 'bg-brand-success text-white'
                    : 'bg-[#EAECEF] text-brand-text-muted'
              }`}
            >
              {done ? '✓' : n}
            </span>
            <span
              className={`hidden whitespace-nowrap text-[13px] font-bold sm:inline ${
                active ? 'text-white' : 'text-brand-text-muted'
              }`}
            >
              {title}
            </span>
          </div>
        );
      })}
    </div>
  );
}
