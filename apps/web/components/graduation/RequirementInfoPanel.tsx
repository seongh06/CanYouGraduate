import { Card } from '../ui/Card';

interface SubstitutionRule {
  type: string;
  condition: string;
  waives: number | null;
  note?: string;
}

interface RequirementInfoPanelProps {
  comprehensiveExam: Record<string, unknown> | null;
  substitutionRules: SubstitutionRule[];
}

// comprehensiveExam은 학과마다 JSON 형식이 완전히 달라(구현 방식 3.4 참고) 자동 판정하지 않고
// 원문을 그대로 보여준다 — key를 대충 읽을 수 있는 라벨로 바꿔주는 정도만 처리.
const FIELD_LABEL: Record<string, string> = {
  majorRequiredCount: '제1전공 필수 이수 과목 수',
  doubleMajorRequiredCount: '복수전공 필수 이수 과목 수',
  requiredAreas: '필수 영역',
  electiveAreas: '선택 영역',
  passingRule: '합격 기준',
};

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

export function RequirementInfoPanel({ comprehensiveExam, substitutionRules }: RequirementInfoPanelProps) {
  if (!comprehensiveExam && substitutionRules.length === 0) return null;

  return (
    <Card className="mb-4">
      <div className="mb-1 text-[15px] font-bold">졸업종합시험 · 대체규정</div>
      <div className="mb-3 text-xs text-brand-text-muted">
        학과마다 규정이 달라 자동으로 판정하지 않아요 — 아래 내용을 직접 확인해주세요.
      </div>

      {comprehensiveExam && (
        <div className="mb-3 flex flex-col gap-1.5 rounded-xl bg-brand-bg px-3.5 py-3">
          {Object.entries(comprehensiveExam).map(([key, value]) => (
            <div key={key} className="text-[13px]">
              <span className="font-bold">{FIELD_LABEL[key] ?? key}: </span>
              <span className="text-brand-text-muted">{formatValue(value)}</span>
            </div>
          ))}
        </div>
      )}

      {substitutionRules.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {substitutionRules.map((rule, i) => (
            <div key={i} className="rounded-xl border border-dashed border-brand-border px-3.5 py-2.5 text-[13px]">
              <span className="font-bold">[{rule.type}]</span> {rule.condition}
              {rule.waives !== null && <span className="text-brand-text-muted"> — {rule.waives}과목 면제</span>}
              {rule.note && <span className="text-brand-text-muted"> ({rule.note})</span>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
