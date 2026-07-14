'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { setSubstitution } from '../../lib/api/courses';
import { listDuplicates, toggleRetake } from '../../lib/api/duplicates';
import { listCourses, listSemesters } from '../../lib/api/everytime';
import { useSession } from '../../lib/session';
import { RetakeBanner } from './RetakeBanner';
import { SemesterReviewGroup } from './SemesterReviewGroup';

interface Step2PanelProps {
  onCalculate: () => void;
}

export function Step2Panel({ onCalculate }: Step2PanelProps) {
  const { sessionId } = useSession();
  const queryClient = useQueryClient();

  const semestersQuery = useQuery({
    queryKey: ['everytime', 'semesters', sessionId],
    queryFn: () => listSemesters(sessionId as string),
    enabled: !!sessionId,
  });
  const semesters = useMemo(() => semestersQuery.data?.semesters ?? [], [semestersQuery.data]);

  const courseQueries = useQueries({
    queries: semesters.map((sem) => ({
      queryKey: ['everytime', 'courses', sessionId, sem.id, 'review'],
      queryFn: () => listCourses(sessionId as string, sem.id, false),
      enabled: !!sessionId,
    })),
  });

  const duplicatesQuery = useQuery({
    queryKey: ['courses', 'duplicates', sessionId],
    queryFn: () => listDuplicates(sessionId as string),
    enabled: !!sessionId,
  });
  const duplicateGroups = duplicatesQuery.data?.duplicateGroups ?? [];

  const semesterLabelsByCourseId = useMemo(() => {
    const map = new Map<number, string>();
    semesters.forEach((sem, i) => {
      const courses = courseQueries[i]?.data?.courses ?? [];
      courses.forEach((c) => map.set(c.id, sem.label));
    });
    return map;
  }, [semesters, courseQueries]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['everytime', 'courses', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['courses', 'duplicates', sessionId] });
  };

  const toggleRetakeMutation = useMutation({
    mutationFn: ({ groupKey, retakeAccepted }: { groupKey: string; retakeAccepted: boolean }) =>
      toggleRetake(sessionId as string, groupKey, retakeAccepted),
    onSuccess: invalidateAll,
  });

  const setSubstitutionMutation = useMutation({
    mutationFn: ({ courseId, catalogCourseId }: { courseId: number; catalogCourseId: number }) =>
      setSubstitution(sessionId as string, courseId, catalogCourseId),
    onSuccess: invalidateAll,
  });

  return (
    <div className="pb-24">
      <RetakeBanner
        groups={duplicateGroups}
        semesterLabelsByCourseId={semesterLabelsByCourseId}
        onToggle={(groupKey, retakeAccepted) => toggleRetakeMutation.mutate({ groupKey, retakeAccepted })}
      />
      {semesters.map((sem, i) => (
        <SemesterReviewGroup
          key={sem.id}
          semester={sem}
          courses={courseQueries[i]?.data?.courses ?? []}
          onSetSubstitution={(courseId, catalogCourseId) =>
            setSubstitutionMutation.mutate({ courseId, catalogCourseId })
          }
        />
      ))}
      <div className="fixed inset-x-0 bottom-7 flex justify-center px-4">
        <button
          onClick={onCalculate}
          className="rounded-full bg-brand-blue px-9 py-4 text-[15px] font-extrabold text-white shadow-[0_10px_24px_rgba(49,130,246,0.35)]"
        >
          학점 계산하기 →
        </button>
      </div>
    </div>
  );
}
