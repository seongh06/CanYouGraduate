'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { CourseList } from '../../../components/calculator/CourseList';
import { FilteredSchedulePanel } from '../../../components/calculator/FilteredSchedulePanel';
import { SemesterList } from '../../../components/calculator/SemesterList';
import { SyncCard } from '../../../components/calculator/SyncCard';
import { deleteCourse, updateCourse } from '../../../lib/api/courses';
import { deleteSemester, listCourses, listSemesters } from '../../../lib/api/everytime';
import { useSession } from '../../../lib/session';
import { useCalculatorStore } from '../../../store/calculator-store';

export default function TimetablePage() {
  const { sessionId, isReady } = useSession();
  const queryClient = useQueryClient();
  const { selectedSemesterId, selectSemester } = useCalculatorStore();
  const [syncing, setSyncing] = useState(false);

  const semestersQuery = useQuery({
    queryKey: ['everytime', 'semesters', sessionId],
    queryFn: () => listSemesters(sessionId as string),
    enabled: isReady && !!sessionId,
    refetchInterval: syncing ? 2000 : false,
  });

  const semesters = useMemo(() => semestersQuery.data?.semesters ?? [], [semestersQuery.data]);

  useEffect(() => {
    if (syncing && semesters.length > 0) setSyncing(false);
  }, [syncing, semesters.length]);

  useEffect(() => {
    if (!selectedSemesterId && semesters.length > 0) {
      selectSemester(semesters.find((s) => s.active)?.id ?? semesters[0].id);
    }
  }, [semesters, selectedSemesterId, selectSemester]);

  const coursesQuery = useQuery({
    queryKey: ['everytime', 'courses', sessionId, selectedSemesterId],
    queryFn: () => listCourses(sessionId as string, selectedSemesterId as number),
    enabled: isReady && !!sessionId && selectedSemesterId !== null,
  });

  const courses = coursesQuery.data?.courses ?? [];
  const currentSemester = semesters.find((s) => s.id === selectedSemesterId);

  const invalidateCourses = () =>
    queryClient.invalidateQueries({ queryKey: ['everytime', 'courses', sessionId, selectedSemesterId] });

  const addBackMutation = useMutation({
    mutationFn: (courseId: number) => updateCourse(sessionId as string, courseId, { general: false }),
    onSuccess: invalidateCourses,
  });
  const deleteMutation = useMutation({
    mutationFn: (courseId: number) => deleteCourse(sessionId as string, courseId),
    onSuccess: invalidateCourses,
  });

  const deleteSemesterMutation = useMutation({
    mutationFn: (semesterId: number) => deleteSemester(sessionId as string, semesterId),
    onSuccess: (_data, semesterId) => {
      if (selectedSemesterId === semesterId) selectSemester(0); // 0은 존재하지 않는 id — 아래 effect가 다음 학기로 다시 선택
      queryClient.invalidateQueries({ queryKey: ['everytime', 'semesters', sessionId] });
    },
  });

  return (
    <>
      <SyncCard synced={semesters.length > 0} syncing={syncing} onSyncStart={() => setSyncing(true)} />

      {semesters.length > 0 && (
        <div className="flex flex-col gap-3.5 sm:grid sm:grid-cols-[220px_1fr] sm:items-start sm:gap-5">
          <SemesterList
            semesters={semesters}
            selectedSemesterId={selectedSemesterId}
            onSelect={selectSemester}
            onDelete={(id) => deleteSemesterMutation.mutate(id)}
          />
          <div className="min-w-0">
            <CourseList semesterLabel={currentSemester?.label ?? ''} courses={courses} />
            <FilteredSchedulePanel
              courses={courses}
              onAddBack={(id) => addBackMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          </div>
        </div>
      )}
    </>
  );
}
