import type { CourseItem, SemesterItem } from '../../lib/api/everytime';
import { Card } from '../ui/Card';
import { CourseReviewRow } from './CourseReviewRow';

interface SemesterReviewGroupProps {
  semester: SemesterItem;
  courses: CourseItem[];
  onSetSubstitution: (courseId: number, catalogCourseId: number) => void;
  onManualCategory: (courseId: number, input: { category: string; credit: number }) => void;
}

export function SemesterReviewGroup({ semester, courses, onSetSubstitution, onManualCategory }: SemesterReviewGroupProps) {
  if (courses.length === 0) return null;

  return (
    <Card className="mb-3.5">
      <div className="mb-2.5 text-[13px] font-extrabold text-brand-text-muted">{semester.label}</div>
      {courses.map((c) => (
        <CourseReviewRow key={c.id} course={c} onSetSubstitution={onSetSubstitution} onManualCategory={onManualCategory} />
      ))}
    </Card>
  );
}
