export interface ParsedSemesterLabel {
  year: number;
  term: string;
}

// 크롤러가 뽑는 실제 학기 라벨 형식("2025년 1학기", "2024년 2학기" — 실 URL로 확인됨)을
// 개설과목리스트 엑셀의 term 표기("1학기"/"2학기"/"하계계절학기"/"동계계절학기")에 맞춘다.
const LABEL_PATTERN = /(\d{4})년\s*(1학기|2학기|하계계절학기|동계계절학기|여름계절학기|겨울계절학기)/;

export function parseSemesterLabel(label: string): ParsedSemesterLabel | null {
  const match = LABEL_PATTERN.exec(label);
  if (!match) return null;
  return { year: Number(match[1]), term: match[2] };
}

// 같은 연도 내 학기 진행 순서(1학기 → 하계계절학기 → 2학기 → 동계계절학기).
export const TERM_RANK: Record<string, number> = {
  '1학기': 0,
  하계계절학기: 1,
  여름계절학기: 1,
  '2학기': 2,
  동계계절학기: 3,
  겨울계절학기: 3,
};
