import type { CourseItem } from '../../lib/api/everytime';
import { Card } from '../ui/Card';

// 실제 개설과목/요람 데이터의 이수구분 원문 그대로를 키로 사용(트리니티 엑셀 헤더 기준).
const CATEGORY_COLORS: Record<string, string> = {
  제1전공필수: '#3182F6',
  제1전공선택: '#5CA1FF',
  제2전공필수: '#7C3AED',
  제2전공선택: '#A78BFA',
  타전공선택: '#94A3B8',
  전공기초: '#FF8B48',
  기초교양필수: '#12B76A',
  중핵교양필수: '#0EA5A5',
  자유선택교양: '#7EDBAE',
};

interface CourseListProps {
  semesterLabel: string;
  courses: CourseItem[];
}

export function CourseList({ semesterLabel, courses }: CourseListProps) {
  const visible = courses.filter((c) => !c.general);

  return (
    <Card className="mb-3.5">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[15px] font-extrabold">{semesterLabel} 수강 과목</div>
        <div className="text-xs text-brand-text-muted">총 {visible.length}과목</div>
      </div>
      {visible.map((c) => (
        <div key={c.id} className="flex flex-wrap items-center gap-3 border-b border-brand-bg py-3 last:border-b-0">
          <div className="h-9 w-1.5 shrink-0 rounded" style={{ background: CATEGORY_COLORS[c.category ?? ''] ?? '#B0B8C1' }} />
          <div className="min-w-0 flex-1">
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold">{c.name}</div>
            <div className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-brand-text-muted">
              {c.code} · {c.category}
              {c.offeringDepartmentName && ` · ${c.offeringDepartmentName}`}
            </div>
          </div>
          {c.foreignLanguageType && (
            <span
              className="shrink-0 rounded-full bg-[#EFF6FF] px-[9px] py-1 text-[11px] font-bold text-brand-blue"
              title={c.foreignLanguageType}
            >
              🌐 외국어강의
            </span>
          )}
          {c.isDuplicate && (
            <span className="shrink-0 rounded-full bg-[#FFF1E6] px-[9px] py-1 text-[11px] font-bold text-brand-warning">
              재수강 의심
            </span>
          )}
          <div className="min-w-[44px] shrink-0 text-right text-sm font-extrabold">{c.credit}학점</div>
        </div>
      ))}
    </Card>
  );
}
