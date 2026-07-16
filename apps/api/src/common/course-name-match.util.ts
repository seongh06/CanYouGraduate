// 과목명 매칭 — 학생마다 실제 과목명 표기가 미묘하게 다르다(구분자 문자가 제각각인 게 실사용
// 데이터로 확인됨: "키스톤디자인·인문창의"는 가운뎃점(U+00B7)인데 "키스톤디자인ㆍ창의설계"는
// 완전히 다른 문자인 한글 아래아(U+318D)를 씀 — 이슈 #53 후속). 공백과 각종 점 구분자
// (가운뎃점 ·, 불릿 연산자 ∙, 한글 아래아 ㆍ, 가타카나 중점 ・, 하이픈점 ‧, 불릿 •)를 모두
// 제거하고 비교한다.
//
// 숫자로 끝나지 않는 패턴(예: "인간학")은 대상 문자열에서 패턴 바로 뒤에 숫자가 이어지는 경우
// (예: "인간학2")를 매치로 보지 않는다 — 20학번처럼 "인간학"이 단일 과목명인 학번과, "인간학1"/
// "인간학2"로 분리된 학번을 같은 패턴 집합으로 함께 다루기 위한 안전장치.
function normalize(text: string): string {
  return text.replace(/\s+/g, '').replace(/[·∙ㆍ・‧•]/g, '');
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
