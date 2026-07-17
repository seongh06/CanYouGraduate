import type { Metadata } from 'next';
import { Providers } from '../lib/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'CanYouGraduate? 너 졸업할 수 있어?',
  description: '에브리타임 시간표로 1초 만에 졸업 가능 여부를 확인하세요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans text-brand-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
