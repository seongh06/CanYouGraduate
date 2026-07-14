import { similarity } from './levenshtein.util';

const DUPLICATE_MERGE_THRESHOLD = 0.85;

export interface GroupableCourse {
  id: number;
  name: string;
}

// course.service.ts의 listDuplicates와 graduation 계산 엔진이 동일한 groupKey를 계산해야
// RetakeGroup 토글 상태가 양쪽에서 같은 그룹을 가리킨다 — 그룹핑 로직을 공유 유틸로 분리.
// 입력 courses는 반드시 "최신 학기 우선"(semester.sortOrder asc, 즉 sortOrder 0=최신) 정렬 상태로 넘겨야
// groupKey(그룹의 첫 번째 courseId)가 항상 "가장 최근 수강 기록"을 가리킨다.
export function groupDuplicateCourses<T extends GroupableCourse>(courses: T[]): Map<string, T[]> {
  const exactGroups = new Map<string, T[]>();
  for (const c of courses) {
    const list = exactGroups.get(c.name) ?? [];
    list.push(c);
    exactGroups.set(c.name, list);
  }

  const mergedGroups = new Map<string, T[]>();
  for (const [name, list] of exactGroups) {
    const canonical = [...mergedGroups.keys()].find((existing) => similarity(name, existing) >= DUPLICATE_MERGE_THRESHOLD);
    const key = canonical ?? name;
    mergedGroups.set(key, [...(mergedGroups.get(key) ?? []), ...list]);
  }

  const result = new Map<string, T[]>();
  for (const list of mergedGroups.values()) {
    const groupKey = String(list[0].id);
    result.set(groupKey, list);
  }
  return result;
}
