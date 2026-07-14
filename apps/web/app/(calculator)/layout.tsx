'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { StartOverFab } from '../../components/layout/StartOverFab';
import { TopBar } from '../../components/layout/TopBar';
import { listSemesters } from '../../lib/api/everytime';
import { useSession } from '../../lib/session';

const STEP_PATHS: Record<1 | 2 | 3, string> = { 1: '/timetable', 2: '/verify', 3: '/result' };
const PATH_STEPS: Record<string, 1 | 2 | 3> = { '/timetable': 1, '/verify': 2, '/result': 3 };

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  const { sessionId, isReady } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isReady && !sessionId) router.replace('/');
  }, [isReady, sessionId, router]);

  const semestersQuery = useQuery({
    queryKey: ['everytime', 'semesters', sessionId],
    queryFn: () => listSemesters(sessionId as string),
    enabled: isReady && !!sessionId,
  });
  const hasSemesters = (semestersQuery.data?.semesters.length ?? 0) > 0;

  if (!isReady || !sessionId) return null;

  const step = PATH_STEPS[pathname] ?? 1;
  const canGoToStep = (n: 1 | 2 | 3) => n === 1 || hasSemesters;

  return (
    <main className="min-h-screen bg-brand-bg pb-28">
      <TopBar step={step} onGoToStep={(n) => router.push(STEP_PATHS[n])} canGoToStep={canGoToStep} />
      <div className="mx-auto max-w-[1120px] px-4 pt-6 sm:px-8">{children}</div>
      <StartOverFab />
    </main>
  );
}
