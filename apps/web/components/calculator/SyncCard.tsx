'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { EverytimeRateLimitedError } from '../../lib/api/client';
import { syncEverytime } from '../../lib/api/everytime';
import { useSession } from '../../lib/session';
import { Card } from '../ui/Card';

interface SyncCardProps {
  synced: boolean;
  syncing: boolean;
  onSyncStart: () => void;
}

export function SyncCard({ synced, syncing, onSyncStart }: SyncCardProps) {
  const { sessionId } = useSession();
  const [url, setUrl] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const syncMutation = useMutation({
    mutationFn: (targetUrl: string) => syncEverytime(sessionId as string, targetUrl),
    onSuccess: () => {
      setErrorMessage(null);
      setRateLimited(false);
      onSyncStart();
    },
    onError: (error) => {
      if (error instanceof EverytimeRateLimitedError) {
        setRateLimited(true);
      } else {
        setErrorMessage(error instanceof Error ? error.message : '동기화 요청에 실패했습니다.');
      }
    },
  });

  return (
    <Card className="mb-5">
      <div className="mb-1 text-[15px] font-bold">에브리타임 시간표 연동</div>
      <div className="mb-4 text-[13px] text-brand-text-muted">
        시간표 URL을 붙여넣으면 좌측 메뉴의 학기 목록을 자동으로 인식해 모든 학기의 수강 내역을 가져와요.
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <input
          placeholder="https://everytime.kr/timetable/@..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={synced}
          className="h-12 min-w-[200px] flex-1 rounded-xl border-[1.5px] border-brand-border bg-[#F8F9FA] px-4 text-sm outline-none disabled:opacity-60"
        />
        {!synced && (
          <button
            onClick={() => url.trim() && syncMutation.mutate(url.trim())}
            disabled={syncMutation.isPending || syncing}
            className="h-12 whitespace-nowrap rounded-xl bg-brand-blue px-[22px] text-sm font-bold text-white disabled:opacity-60"
          >
            {syncing ? '동기화 진행 중...' : '동기화하기'}
          </button>
        )}
        {synced && (
          <div className="flex h-12 items-center gap-2 whitespace-nowrap rounded-xl bg-[#E7F6EE] px-[18px] text-sm font-bold text-brand-success">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-brand-success text-[11px] text-white">
              ✓
            </span>
            다중 학기 동기화 완료
          </div>
        )}
      </div>
      {rateLimited && (
        <div className="mt-3 text-xs font-semibold text-brand-warning">
          일시적으로 에브리타임 연동이 지연되고 있습니다. 텍스트 붙여넣기 백업은 다음 업데이트에서 지원됩니다.
        </div>
      )}
      {errorMessage && <div className="mt-3 text-xs font-semibold text-brand-error">{errorMessage}</div>}
    </Card>
  );
}
