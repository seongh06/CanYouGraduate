'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { GA_MEASUREMENT_ID, pageview } from '../../lib/gtag';

// Next.js App Router는 클라이언트 사이드 라우팅(step 이동, / → /timetable → /verify → /result)
// 시 실제 페이지 리로드가 없어 gtag.js가 기본으로 잡아주는 page_view가 안 찍힌다 — 이탈 지점을
// 스텝 단위로 보려는 목적 자체가 이 라우팅 이벤트를 놓치면 무의미해지므로 경로가 바뀔 때마다
// 수동으로 page_view를 보낸다. useSearchParams는 App Router에서 Suspense 경계가 필수라 분리.
function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    pageview(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
    </>
  );
}
