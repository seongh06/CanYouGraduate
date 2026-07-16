'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiError } from '../../../lib/api/client';
import {
  calculateGraduation,
  getGraduationRequirements,
  updateCatholicCheck,
  updateLanguageScore,
  updateThesis,
} from '../../../lib/api/graduation';
import type { CreditBreakdownItem } from '../../../lib/api/graduation';
import { getProfile, updateProfile } from '../../../lib/api/profile';
import { useSession } from '../../../lib/session';
import { CatholicChecklist } from '../../../components/graduation/CatholicChecklist';
import { CreditBreakdownList } from '../../../components/graduation/CreditBreakdownList';
import { LanguageAndThesisCard } from '../../../components/graduation/LanguageAndThesisCard';
import { RequirementInfoPanel } from '../../../components/graduation/RequirementInfoPanel';
import { SummaryGauge } from '../../../components/graduation/SummaryGauge';
import { TrackPreviewSelector } from '../../../components/graduation/TrackPreviewSelector';
import { Card } from '../../../components/ui/Card';

type MajorTab = 'FIRST' | 'SECOND';

export default function ResultPage() {
  const { sessionId } = useSession();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<MajorTab>('FIRST');

  const profileQuery = useQuery({
    queryKey: ['profile', sessionId],
    queryFn: () => getProfile(sessionId as string),
    enabled: !!sessionId,
  });

  // 트랙 미리보기: 프로필에 저장된 값으로 초기화하고, 사용자가 직접 건드리기 전까지는
  // 프로필이 갱신될 때(예: 확정 버튼으로 저장 후) 계속 그 값을 따라간다.
  const [previewTrackId, setPreviewTrackId] = useState<number | null>(null);
  const [trackTouched, setTrackTouched] = useState(false);
  useEffect(() => {
    if (!trackTouched && profileQuery.data) {
      setPreviewTrackId(profileQuery.data.majorTrack?.id ?? null);
    }
  }, [profileQuery.data, trackTouched]);

  const query = useQuery({
    queryKey: ['graduation', 'calculate', sessionId, previewTrackId],
    queryFn: () => calculateGraduation(sessionId as string, previewTrackId),
    enabled: !!sessionId,
    retry: false,
  });

  const requirementsQuery = useQuery({
    queryKey: ['graduation', 'requirements', sessionId, previewTrackId],
    queryFn: () => getGraduationRequirements(sessionId as string, previewTrackId),
    enabled: !!sessionId,
    retry: false,
  });

  const confirmTrackMutation = useMutation({
    mutationFn: (trackId: number | null) => updateProfile(sessionId as string, { majorTrackId: trackId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', sessionId] }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['graduation', 'calculate', sessionId] });

  const checkMutation = useMutation({
    mutationFn: ({ key, checked }: { key: string; checked: boolean }) =>
      updateCatholicCheck(sessionId as string, key, checked),
    onSuccess: invalidate,
  });
  const languageMutation = useMutation({
    mutationFn: ({ examType, score }: { examType: string; score: number }) =>
      updateLanguageScore(sessionId as string, examType, score),
    onSuccess: invalidate,
  });
  const thesisMutation = useMutation({
    mutationFn: (pass: boolean) => updateThesis(sessionId as string, pass),
    onSuccess: invalidate,
  });

  if (query.isLoading) {
    return (
      <Card>
        <div className="text-sm font-bold">계산 중이에요...</div>
      </Card>
    );
  }

  if (query.isError) {
    const error = query.error;
    const status = error instanceof ApiError ? error.status : null;
    const message = error instanceof Error ? error.message : '계산에 실패했습니다.';

    if (status === 409) {
      return (
        <Card>
          <div className="mb-2 text-sm font-bold text-brand-error">아직 계산할 수 없어요</div>
          <div className="mb-4 text-[13px] text-brand-text-muted">{message}</div>
          <Link href="/verify" className="text-[13px] font-bold text-brand-blue">
            검증 & 설정으로 돌아가기 →
          </Link>
        </Card>
      );
    }

    return (
      <Card>
        <div className="mb-2 text-sm font-bold text-brand-error">계산에 실패했어요</div>
        <div className="text-[13px] text-brand-text-muted">{message}</div>
      </Card>
    );
  }

  const data = query.data!;
  const hasSecondMajor = !!data.secondMajor;
  const activeMajor = tab === 'SECOND' && data.secondMajor ? data.secondMajor : null;

  // 기초/중핵교양(공통 요건)을 학점구성과 동일한 형태·위치(졸업학점현황 바로 아래)로 보여준다
  // (이슈 #53) — 어떤 과목으로 인정받았는지도 CreditBreakdownList의 기존 펼치기 UI를 재사용.
  const commonLiberalArtsItems: CreditBreakdownItem[] = data.commonLiberalArts
    ? (
        [
          data.commonLiberalArts.basicRequired > 0 && {
            key: 'commonBasic',
            label: '기초교양',
            required: data.commonLiberalArts.basicRequired,
            earned: data.commonLiberalArts.basicEarned,
            earnedCourses: data.commonLiberalArts.basicCourses,
            status: data.commonLiberalArts.basicEarned >= data.commonLiberalArts.basicRequired ? 'pass' : 'fail',
          },
          data.commonLiberalArts.coreRequired > 0 && {
            key: 'commonCore',
            label: '중핵교양',
            required: data.commonLiberalArts.coreRequired,
            earned: data.commonLiberalArts.coreEarned,
            earnedCourses: data.commonLiberalArts.coreCourses,
            status: data.commonLiberalArts.coreEarned >= data.commonLiberalArts.coreRequired ? 'pass' : 'fail',
          },
        ] as Array<CreditBreakdownItem | false>
      ).filter((item): item is CreditBreakdownItem => !!item)
    : [];

  return (
    <div className="pb-10">
      <SummaryGauge
        totalCredits={data.totalCredits}
        totalCreditMin={data.totalCreditMin}
        remainingCredits={data.remainingCredits}
        completionPercent={data.completionPercent}
        creditBreakdown={data.creditBreakdown}
        secondMajorCreditBreakdown={data.secondMajor?.creditBreakdown}
        commonLiberalArts={data.commonLiberalArts}
        minor={data.minor}
        foreignLanguageCredits={data.foreignLanguageCredits}
      />

      <CreditBreakdownList items={commonLiberalArtsItems} title="공통 교양(기초·중핵)" />
      <CatholicChecklist checks={data.catholicChecks} onToggle={(key, checked) => checkMutation.mutate({ key, checked })} />

      {profileQuery.data && (
        <TrackPreviewSelector
          departmentId={profileQuery.data.majorDepartment.id}
          previewTrackId={previewTrackId}
          savedTrackId={profileQuery.data.majorTrack?.id ?? null}
          onChange={(trackId) => {
            setTrackTouched(true);
            setPreviewTrackId(trackId);
          }}
          onConfirm={() => confirmTrackMutation.mutate(previewTrackId)}
          confirming={confirmTrackMutation.isPending}
        />
      )}

      {hasSecondMajor && (
        <div className="mb-3.5 flex gap-1.5 rounded-xl bg-brand-bg p-1">
          {(
            [
              ['FIRST', '제1전공'],
              ['SECOND', '제2전공'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 rounded-lg py-2 text-[13px] font-bold transition-colors ${
                tab === key ? 'bg-white text-brand-blue shadow-sm' : 'text-brand-text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {activeMajor ? (
        activeMajor.creditBreakdown.length === 0 && activeMajor.totalCreditMin === null ? (
          <Card className="mb-4">
            <div className="text-[13px] text-brand-text-muted">
              이 학과는 복수전공 졸업요건 데이터가 아직 준비되지 않았어요.
            </div>
          </Card>
        ) : (
          <>
            <CreditBreakdownList items={activeMajor.creditBreakdown} />
            <RequirementInfoPanel
              comprehensiveExam={activeMajor.comprehensiveExam}
              substitutionRules={activeMajor.substitutionRules}
            />
          </>
        )
      ) : (
        <>
          <CreditBreakdownList items={data.creditBreakdown} />
          <RequirementInfoPanel comprehensiveExam={data.comprehensiveExam} substitutionRules={data.substitutionRules} />
        </>
      )}

      <LanguageAndThesisCard
        languageScoreStandard={requirementsQuery.data?.languageScoreStandard ?? null}
        languageScore={data.languageScore}
        languageExamType={data.languageExamType}
        languageScorePass={data.languageScorePass}
        thesisPass={data.thesisPass}
        thesisOptional={data.thesisOptional}
        // 졸업논문/시험 자기신고 섹션은 사용자 판단으로 UI에서 완전히 숨김(이슈 #51) — 이미 통과했으면
        // 애초에 이 화면을 볼 필요가 없다는 지적. thesisPass/thesisOptional 데이터·API는 유지.
        showThesisSection={false}
        onSubmitLanguageScore={(examType, score) => languageMutation.mutate({ examType, score })}
        onToggleThesis={(pass) => thesisMutation.mutate(pass)}
      />
    </div>
  );
}
