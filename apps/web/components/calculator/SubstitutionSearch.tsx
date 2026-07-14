'use client';

import { useQuery } from '@tanstack/react-query';
import { useDeferredValue, useState } from 'react';
import { searchCatalogCourses } from '../../lib/api/catalog';
import { useSession } from '../../lib/session';

interface SubstitutionSearchProps {
  onPick: (catalogCourseId: number, name: string) => void;
}

export function SubstitutionSearch({ onPick }: SubstitutionSearchProps) {
  const { sessionId } = useSession();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const resultsQuery = useQuery({
    queryKey: ['catalog', 'courses', sessionId, deferredQuery],
    queryFn: () => searchCatalogCourses(sessionId as string, deferredQuery),
    enabled: !!sessionId,
  });

  const results = resultsQuery.data?.results ?? [];

  return (
    <div className="mt-2.5 rounded-xl border border-brand-border bg-[#F8F9FA] p-3.5">
      <div className="mb-2 text-xs text-brand-text-muted">가톨릭대 요람 DB에서 현재 개설 과목을 검색해 매칭하세요</div>
      <input
        placeholder="과목명 검색 (예: 프로그래밍)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-2 h-10 w-full rounded-[10px] border-[1.5px] border-brand-border bg-white px-3.5 text-[13px] outline-none"
      />
      <div className="flex max-h-[150px] flex-col gap-1.5 overflow-y-auto">
        {results.map((r) => (
          <div
            key={r.catalogCourseId}
            onClick={() => onPick(r.catalogCourseId, r.name)}
            className="cursor-pointer rounded-lg border border-brand-border bg-white px-3 py-2 text-[13px] font-semibold"
          >
            {r.name}
          </div>
        ))}
      </div>
    </div>
  );
}
