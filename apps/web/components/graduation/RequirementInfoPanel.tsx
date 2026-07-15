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
  hasExam: '졸업시험 여부',
  detail: '상세 내용',
  examSubjects: '시험 과목',
};

// substitutionRules[].type 영문 코드를 사람이 읽을 라벨/배지 스타일로.
const RULE_TYPE_LABEL: Record<string, string> = {
  LANGUAGE: '언어',
  CERTIFICATE: '자격증',
  COMPETITION: '대회',
  THESIS: '논문',
  OTHER: '기타',
};

const RULE_TYPE_STYLE: Record<string, string> = {
  LANGUAGE: 'bg-[#EAF2FF] text-brand-blue',
  CERTIFICATE: 'bg-[#F3EAFB] text-[#8B5CF6]',
  COMPETITION: 'bg-[#FFF3E0] text-[#E08A00]',
  THESIS: 'bg-[#E7F6EE] text-brand-success',
  OTHER: 'bg-[#EAECEF] text-brand-text-muted',
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
        <div className="mb-3 flex flex-col gap-2 rounded-xl bg-brand-bg px-3.5 py-3">
          {Object.entries(comprehensiveExam).map(([key, value]) => (
            <div key={key} className="text-[13px]">
              <div className="font-bold">{FIELD_LABEL[key] ?? key}</div>
              <div className="mt-0.5 text-brand-text-muted">{formatValue(value)}</div>
            </div>
          ))}
        </div>
      )}

      {substitutionRules.length > 0 && (
        <div className="flex flex-col gap-2">
          {substitutionRules.map((rule, i) => (
            <div key={i} className="rounded-xl border border-brand-border px-3.5 py-3 text-[13px]">
              <span
                className={`mr-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  RULE_TYPE_STYLE[rule.type] ?? RULE_TYPE_STYLE.OTHER
                }`}
              >
                {RULE_TYPE_LABEL[rule.type] ?? rule.type}
              </span>
              {rule.condition}
              {rule.waives !== null && <span className="text-brand-text-muted"> — {rule.waives}과목 면제</span>}
              {rule.note && <div className="mt-1 text-xs text-brand-text-muted">{rule.note}</div>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
