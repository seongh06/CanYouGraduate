'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '../../lib/session';

export function StartOverFab() {
  const { clearSession } = useSession();
  const router = useRouter();

  const handleClick = () => {
    const confirmed = window.confirm(
      '처음부터 다시 시작하면 지금까지 동기화한 시간표와 검증 설정이 모두 사라져요. 계속할까요?',
    );
    if (!confirmed) return;
    clearSession();
    router.replace('/');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-7 right-4 z-20 flex h-12 items-center gap-2 rounded-full border-[1.5px] border-brand-border bg-white px-5 text-sm font-bold text-brand-text-muted shadow-[0_10px_24px_rgba(0,0,0,0.12)] sm:right-8"
    >
      <span aria-hidden>↺</span>
      처음부터
    </button>
  );
}
