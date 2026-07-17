import { similarity } from './levenshtein.util';

const DUPLICATE_MERGE_THRESHOLD = 0.85;

export interface GroupableCourse {
  id: number;
  name: string;
}

// "컴퓨터와프로그래밍1" vs "컴퓨터와프로그래밍2"처럼 끝자리 숫자만 다른 이름은 Levenshtein
// 유사도가 threshold를 넘기 쉽지만(1글자 차이) 실제로는 같은 과목이 아니라 시리즈로 번호가 매겨진
// 별개의 과목이다(실사용 중 발견 — 재수강 오탐지). 끝자리 숫자가 서로 다르면 유사도가 아무리
// 높아도 병합하지 않는다.
function trailingNumber(name: string): string | null {
  const match = /(\d+)\s*$/.exec(name);
  return match ? match[1] : null;
}

function isSameCourseByFuzzyMatch(a: string, b: string): boolean {
  if (similarity(a, b) < DUPLICATE_MERGE_THRESHOLD) return false;
  const numA = trailingNumber(a);
  const numB = trailingNumber(b);
  if (numA !== null && numB !== null && numA !== numB) return false;
  return true;
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
    const canonical = [...mergedGroups.keys()].find((existing) => isSameCourseByFuzzyMatch(name, existing));
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
