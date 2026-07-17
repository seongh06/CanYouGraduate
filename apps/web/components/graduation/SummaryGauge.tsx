import type { CommonLiberalArts, CreditBreakdownItem, ForeignLanguageCredits, MinorCredit } from '../../lib/api/graduation';
import { Card } from '../ui/Card';

interface SummaryGaugeProps {
  totalCredits: number;
  totalCreditMin: number | null;
  remainingCredits: number | null;
  completionPercent: number | null;
  creditBreakdown: CreditBreakdownItem[];
  secondMajorCreditBreakdown?: CreditBreakdownItem[];
  commonLiberalArts: CommonLiberalArts | null;
  minor: MinorCredit | null;
  foreignLanguageCredits: ForeignLanguageCredits;
}

// 카테고리별 학점 현황 색상 — dataviz 스킬 palette.md 카테고리 팔레트에서 슬롯을 골라 6색 전체
// 조합으로 재검증(validate_palette.js, light/dark 모두 ALL PASS)한 고정 순서. 엔티티마다 색을
// 고정해서 유지한다(제1/2전공 색은 기존 화면과 동일하게 유지, 전공기초/부전공만 신규 슬롯 추가).
// 색만으로 구분하지 않도록 각 막대에 항상 라벨 + 수치 텍스트를 같이 보여준다.
const CATEGORY_COLORS = {
  basic: '#e87ba4', // 기초교양
  core: '#eda100', // 중핵교양
  majorBasic: '#1baf7a', // 전공기초
  major1: '#2a78d6', // 제1전공
  major2: '#008300', // 제2전공
  minor: '#4a3aa7', // 부전공
} as const;

// 학과마다 creditBreakdown 키 체계가 다르므로(크롤러 키/영문 레거시 키/프로그램 단위 키), 각
// 카테고리를 대표할 만한 키를 우선순위대로 찾는다 — 이미 status:'unavailable'인 항목은
// earned를 신뢰할 수 없어 제외한다(category-key-map.ts 참고).
const MAJOR_KEYS = ['전공이수학점 계', 'majorDeepMin', 'doubleMajorMin', 'major', '전공선택'];
const MAJOR_BASIC_KEYS = ['전공기초', 'majorBasic'];

function findBucket(items: CreditBreakdownItem[], candidateKeys: string[]) {
  for (const key of candidateKeys) {
    const found = items.find((i) => i.key === key && i.status !== 'unavailable');
    if (found && found.earned !== null) return found;
  }
  return null;
}

function CategoryBar({ label, color, earned, required }: { label: string; color: string; earned: number; required: number }) {
  const percent = required > 0 ? Math.min(Math.round((earned / required) * 100), 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[76px] shrink-0 text-xs font-bold text-brand-text">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-bg">
        <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
      <span className="w-16 shrink-0 text-right text-xs text-brand-text-muted">
        {earned}/{required}
      </span>
    </div>
  );
}

export function SummaryGauge({
  totalCredits,
  totalCreditMin,
  remainingCredits,
  completionPercent,
  creditBreakdown,
  secondMajorCreditBreakdown,
  commonLiberalArts,
  minor,
  foreignLanguageCredits,
}: SummaryGaugeProps) {
  const major1 = findBucket(creditBreakdown, MAJOR_KEYS);
  const major2 = secondMajorCreditBreakdown ? findBucket(secondMajorCreditBreakdown, MAJOR_KEYS) : null;
  const majorBasic1 = findBucket(creditBreakdown, MAJOR_BASIC_KEYS);
  const majorBasic2 = secondMajorCreditBreakdown ? findBucket(secondMajorCreditBreakdown, MAJOR_BASIC_KEYS) : null;
  // 전공기초는 제1/2전공 중 기준(required)이 더 높은 쪽 하나만 대표로 보여준다(사용자 확인).
  const majorBasic =
    majorBasic1 && majorBasic2 ? (majorBasic1.required >= majorBasic2.required ? majorBasic1 : majorBasic2) : majorBasic1 ?? majorBasic2;

  type Bar = { label: string; color: string; earned: number; required: number };
  const categoryBars: Bar[] = (
    [
      commonLiberalArts &&
        commonLiberalArts.basicRequired > 0 && {
          label: '기초교양',
          color: CATEGORY_COLORS.basic,
          earned: commonLiberalArts.basicEarned,
          required: commonLiberalArts.basicRequired,
        },
      commonLiberalArts &&
        commonLiberalArts.coreRequired > 0 && {
          label: '중핵교양',
          color: CATEGORY_COLORS.core,
          earned: commonLiberalArts.coreEarned,
          required: commonLiberalArts.coreRequired,
        },
      majorBasic && {
        label: '전공기초',
        color: CATEGORY_COLORS.majorBasic,
        earned: majorBasic.earned!,
        required: majorBasic.required,
      },
      major1 && { label: '제1전공', color: CATEGORY_COLORS.major1, earned: major1.earned!, required: major1.required },
      major2 && { label: '제2전공', color: CATEGORY_COLORS.major2, earned: major2.earned!, required: major2.required },
      minor &&
        minor.requiredCredit > 0 && {
          label: '부전공',
          color: CATEGORY_COLORS.minor,
          earned: minor.earnedCredit,
          required: minor.requiredCredit,
        },
    ] as Array<Bar | null>
  ).filter((b): b is Bar => !!b);

  return (
    <Card className="mb-4">
      <div className="mb-1 text-[15px] font-bold">졸업 학점 현황</div>
      {totalCreditMin === null ? (
        <div className="text-[13px] text-brand-text-muted">
          이 학과는 졸업 기준 총 학점이 아직 준비되지 않았어요. 현재까지 이수한 학점만 보여드려요.
        </div>
      ) : (
        <>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-brand-bg">
            <div
              className="h-full rounded-full bg-brand-blue transition-all"
              style={{ width: `${Math.min(completionPercent ?? 0, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-brand-text-muted">
            잔여 {remainingCredits}학점 · 이수율 {completionPercent}%
          </div>
        </>
      )}
      <div className="mt-4 flex items-end gap-1.5">
        <span className="text-3xl font-extrabold text-brand-blue">{totalCredits}</span>
        <span className="mb-1 text-sm text-brand-text-muted">
          / {totalCreditMin ?? '?'}학점
        </span>
      </div>

      {categoryBars.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 border-t border-brand-border pt-3.5">
          {categoryBars.map((bar) => (
            <CategoryBar key={bar.label} {...bar} />
          ))}
        </div>
      )}

      {/* 학과·학번마다 요구 기준이 달라 아직 필요 학점 데이터가 없다 — pass/fail 없이 정보성으로만
          표시한다(이슈 #53). */}
      {foreignLanguageCredits.count > 0 && (
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="w-[76px] shrink-0 text-xs font-bold text-brand-text">외국어강의</span>
          <span className="flex-1 text-xs text-brand-text-muted">
            {foreignLanguageCredits.totalCredit}학점 ({foreignLanguageCredits.count}과목) 이수 · 학과·학번별 기준은 아직 준비되지 않았어요
          </span>
        </div>
      )}
    </Card>
  );
}
