// 과목명 매칭 — 학생마다 실제 과목명 표기가 미묘하게 다르다(가운뎃점 "·" 대신 공백, 붙여쓰기 등,
// 이슈 #53에서 "키스톤디자인·인문창의"가 "키스톤디자인 인문창의"로 들어와 매칭 실패한 사례 확인).
// 공백과 가운뎃점(·/∙)을 모두 제거하고 비교한다.
//
// 숫자로 끝나지 않는 패턴(예: "인간학")은 대상 문자열에서 패턴 바로 뒤에 숫자가 이어지는 경우
// (예: "인간학2")를 매치로 보지 않는다 — 20학번처럼 "인간학"이 단일 과목명인 학번과, "인간학1"/
// "인간학2"로 분리된 학번을 같은 패턴 집합으로 함께 다루기 위한 안전장치.
function normalize(text: string): string {
  return text.replace(/\s+/g, '').replace(/[·∙]/g, '');
}

export function courseNameMatchesPattern(courseName: string, pattern: string): boolean {
  const normName = normalize(courseName);
  const normPattern = normalize(pattern);
  if (!normPattern) return false;

  if (/\d$/.test(normPattern)) {
    return normName.includes(normPattern);
  }

  const idx = normName.indexOf(normPattern);
  if (idx === -1) return false;
  const nextChar = normName[idx + normPattern.length];
  return !nextChar || !/\d/.test(nextChar);
}
