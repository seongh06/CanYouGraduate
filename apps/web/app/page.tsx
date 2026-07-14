'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { CourseList } from '../components/calculator/CourseList';
import { FilteredSchedulePanel } from '../components/calculator/FilteredSchedulePanel';
import { SemesterList } from '../components/calculator/SemesterList';
import { Step2Panel } from '../components/calculator/Step2Panel';
import { SyncCard } from '../components/calculator/SyncCard';
import { TopBar } from '../components/layout/TopBar';
import { OnboardingForm } from '../components/onboarding/OnboardingForm';
import { Card } from '../components/ui/Card';
import { deleteCourse, updateCourse } from '../lib/api/courses';
import { listCourses, listSemesters } from '../lib/api/everytime';
import { useSession } from '../lib/session';
import { useCalculatorStore } from '../store/calculator-store';

export default function HomePage() {
  const { sessionId, isReady } = useSession();
  const queryClient = useQueryClient();
  const { step, goToStep, selectedSemesterId, selectSemester } = useCalculatorStore();
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

  const canGoToStep = (n: 1 | 2 | 3) => n === 1 || semesters.length > 0;

  if (!isReady) return null;

  if (!sessionId) {
    return (
      <main className="min-h-screen bg-brand-bg px-4 py-10">
        <OnboardingForm />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg pb-28">
      <TopBar step={step} onGoToStep={goToStep} canGoToStep={canGoToStep} />
      <div className="mx-auto max-w-[1120px] px-4 pt-6 sm:px-8">
        {step === 1 && (
          <>
            <SyncCard synced={semesters.length > 0} syncing={syncing} onSyncStart={() => setSyncing(true)} />

            {semesters.length > 0 && (
              <div className="flex flex-col gap-3.5 sm:grid sm:grid-cols-[220px_1fr] sm:items-start sm:gap-5">
                <SemesterList semesters={semesters} selectedSemesterId={selectedSemesterId} onSelect={selectSemester} />
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
        )}

        {step === 2 && <Step2Panel onCalculate={() => goToStep(3)} />}

        {step === 3 && (
          <Card>
            <div className="text-sm font-bold">STEP3 대시보드는 다음 이슈에서 구현됩니다.</div>
          </Card>
        )}
      </div>
    </main>
  );
}
