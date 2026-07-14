'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { OnboardingForm } from '../components/onboarding/OnboardingForm';
import { useSession } from '../lib/session';

export default function HomePage() {
  const { sessionId, isReady } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isReady && sessionId) router.replace('/timetable');
  }, [isReady, sessionId, router]);

  if (!isReady || sessionId) return null;

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10">
      <OnboardingForm />
    </main>
  );
}
