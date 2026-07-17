import Image from 'next/image';
import { StepPills } from './StepPills';

interface TopBarProps {
  step: 1 | 2 | 3;
  onGoToStep: (n: 1 | 2 | 3) => void;
  canGoToStep: (n: 1 | 2 | 3) => boolean;
}

export function TopBar({ step, onGoToStep, canGoToStep }: TopBarProps) {
  return (
    <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-8 sm:pt-7">
      <div className="flex items-center gap-2.5">
        <Image src="/logo.svg" alt="CanYouGraduate? 로고" width={34} height={34} className="shrink-0 rounded-[10px]" priority />
        <div>
          <div className="text-[17px] font-extrabold tracking-tight">졸업학점계산기</div>
          <div className="mt-0.5 text-xs text-brand-text-muted">가톨릭대학교 성심교정 · 학사요람 기준</div>
        </div>
      </div>
      <StepPills step={step} onGoToStep={onGoToStep} canGoToStep={canGoToStep} />
    </div>
  );
}
