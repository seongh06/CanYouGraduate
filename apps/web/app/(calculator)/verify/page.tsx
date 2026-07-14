'use client';

import { useRouter } from 'next/navigation';
import { Step2Panel } from '../../../components/calculator/Step2Panel';

export default function VerifyPage() {
  const router = useRouter();
  return <Step2Panel onCalculate={() => router.push('/result')} />;
}
