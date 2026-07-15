'use client';

import { useQuery } from '@tanstack/react-query';
import { listTracks } from '../../lib/api/university';

interface TrackPreviewSelectorProps {
  departmentId: number;
  previewTrackId: number | null;
  savedTrackId: number | null;
  onChange: (trackId: number | null) => void;
  onConfirm: () => void;
  confirming: boolean;
}

// 제1전공 트랙을 온보딩에서 확정하지 않았어도, 결과화면에서 트랙을 바꿔가며
// "이 트랙을 타면 학점이 이렇게 나오는구나"를 미리 보고 결정할 수 있게 하는 셀렉터.
// 드롭다운을 바꾸는 것만으로는 프로필에 저장되지 않고(순수 미리보기), 저장된 값과
// 달라졌을 때만 "이 트랙으로 결정하기" 버튼이 나타나 명시적으로 눌러야 실제 반영된다.
export function TrackPreviewSelector({
  departmentId,
  previewTrackId,
  savedTrackId,
  onChange,
  onConfirm,
  confirming,
}: TrackPreviewSelectorProps) {
  const tracksQuery = useQuery({
    queryKey: ['tracks', departmentId],
    queryFn: () => listTracks(departmentId),
  });
  const tracks = tracksQuery.data?.tracks ?? [];

  if (tracks.length === 0) return null;

  const isDirty = previewTrackId !== savedTrackId;

  return (
    <div className="mb-3.5 flex flex-wrap items-center gap-2 rounded-xl border border-brand-border bg-[#F8F9FA] px-3.5 py-3">
      <span className="text-xs font-bold text-brand-text-muted">제1전공 트랙 미리보기</span>
      <select
        value={previewTrackId ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="h-9 rounded-lg border-[1.5px] border-brand-border bg-white px-2.5 text-xs outline-none"
      >
        <option value="">선택 안 함</option>
        {tracks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      {isDirty && (
        <button
          onClick={onConfirm}
          disabled={confirming}
          className="h-9 rounded-lg bg-brand-blue px-3 text-xs font-bold text-white disabled:opacity-50"
        >
          이 트랙으로 결정하기
        </button>
      )}
    </div>
  );
}
