import type { CourseItem } from '../../lib/api/everytime';
import { Card } from '../ui/Card';

const CATEGORY_COLORS: Record<string, string> = {
  전공필수: '#3182F6',
  전공선택: '#5CA1FF',
  교양필수: '#12B76A',
  교양선택: '#7EDBAE',
  전공기초: '#FF8B48',
  기타: '#B0B8C1',
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
            </div>
          </div>
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
