import { Injectable } from '@nestjs/common';

export interface ParsedCourseLine {
  name: string;
  code: string | null;
  credit: number;
}

export interface TextParseResult {
  courses: ParsedCourseLine[];
  unparsedLineCount: number;
}

// 에브리타임 시간표 화면에서 복사한 텍스트의 한 줄 예시: "데이터베이스 CSE3021 3학점 화목 3-4교시"
// 과목코드는 없을 수도 있음(예: "봉사학습1 1학점"). 요일/교시 뒤쪽 텍스트는 사용하지 않고 버린다.
const COURSE_LINE_PATTERN = /^(.+?)\s+([A-Z]{2,4}\d{3,4})?\s*(\d+)\s*학점/;

@Injectable()
export class EverytimeTextParserService {
  parse(rawText: string): TextParseResult {
    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const courses: ParsedCourseLine[] = [];
    let unparsedLineCount = 0;

    for (const line of lines) {
      const match = COURSE_LINE_PATTERN.exec(line);
      if (!match) {
        unparsedLineCount += 1;
        continue;
      }
      const [, rawName, code, creditText] = match;
      courses.push({
        name: rawName.trim(),
        code: code ?? null,
        credit: Number(creditText),
      });
    }

    return { courses, unparsedLineCount };
  }
}
