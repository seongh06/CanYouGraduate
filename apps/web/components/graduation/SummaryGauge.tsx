import type { CreditBreakdownItem } from '../../lib/api/graduation';
import { Card } from '../ui/Card';

interface SummaryGaugeProps {
  totalCredits: number;
  totalCreditMin: number | null;
  remainingCredits: number | null;
  completionPercent: number | null;
  creditBreakdown: CreditBreakdownItem[];
  secondMajorCreditBreakdown?: CreditBreakdownItem[];
}

// 카테고리별 학점 현황 색상 — dataviz 스킬 팔레트 검증 통과한 4색(고정 순서, CVD 안전).
// 색만으로 구분하지 않도록 각 막대에 항상 라벨 + 수치 텍스트를 같이 보여준다.
const CATEGORY_COLORS = {
  major1: '#2a78d6', // 제1전공
  major2: '#008300', // 제2전공
  liberal: '#e87ba4', // 공통교양
  core: '#eda100', // 중핵교양
} as const;

// 학과마다 creditBreakdown 키 체계가 다르므로(크롤러 키/영문 레거시 키/프로그램 단위 키), 각
// 카테고리를 대표할 만한 키를 우선순위대로 찾는다 — 이미 status:'unavailable'인 항목은
// earned를 신뢰할 수 없어 제외한다(category-key-map.ts 참고).
const MAJOR_KEYS = ['전공이수학점 계', 'majorDeepMin', 'doubleMajorMin', 'major', '전공선택'];
const LIBERAL_KEYS = ['교양이수학점 계', '기초필수', 'generalBasicRequired', 'general'];
const CORE_KEYS = ['중핵교양', 'generalCore'];

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
}: SummaryGaugeProps) {
  const major1 = findBucket(creditBreakdown, MAJOR_KEYS);
  const major2 = secondMajorCreditBreakdown ? findBucket(secondMajorCreditBreakdown, MAJOR_KEYS) : null;
  const liberal = findBucket(creditBreakdown, LIBERAL_KEYS);
  const core = findBucket(creditBreakdown, CORE_KEYS);

  type Bar = { label: string; color: string; earned: number; required: number };
  const categoryBars: Bar[] = (
    [
      major1 && { label: '제1전공', color: CATEGORY_COLORS.major1, earned: major1.earned!, required: major1.required },
      major2 && { label: '제2전공', color: CATEGORY_COLORS.major2, earned: major2.earned!, required: major2.required },
      liberal && { label: '공통교양', color: CATEGORY_COLORS.liberal, earned: liberal.earned!, required: liberal.required },
      core && { label: '중핵교양', color: CATEGORY_COLORS.core, earned: core.earned!, required: core.required },
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
    </Card>
  );
}
