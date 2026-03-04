export interface Chunk {
  seq: number;
  text: string;
  charOffset: number;
}

const TARGET_CHARS = 3600; // ~900 tokens
const OVERLAP_RATIO = 0.15;
const OVERLAP_CHARS = Math.floor(TARGET_CHARS * OVERLAP_RATIO);

// Breakpoint scores — higher = better split point
const BREAK_SCORES: Record<string, number> = {
  h1: 100,
  h2: 90,
  h3: 80,
  hr: 60,
  paragraph: 20,
  sentence: 10,
  newline: 5,
};

interface Breakpoint {
  index: number;
  type: string;
  score: number;
}

function findBreakpoints(text: string): Breakpoint[] {
  const breakpoints: Breakpoint[] = [];
  const lines = text.split("\n");
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      breakpoints.push({ index: offset, type: "h1", score: BREAK_SCORES.h1 });
    } else if (trimmed.startsWith("## ")) {
      breakpoints.push({ index: offset, type: "h2", score: BREAK_SCORES.h2 });
    } else if (trimmed.startsWith("### ")) {
      breakpoints.push({ index: offset, type: "h3", score: BREAK_SCORES.h3 });
    } else if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      breakpoints.push({ index: offset, type: "hr", score: BREAK_SCORES.hr });
    } else if (trimmed === "") {
      breakpoints.push({ index: offset, type: "paragraph", score: BREAK_SCORES.paragraph });
    }

    // Sentence boundaries within the line
    const sentenceEnds = [...line.matchAll(/[.!?]\s/g)];
    for (const match of sentenceEnds) {
      if (match.index !== undefined) {
        breakpoints.push({
          index: offset + match.index + 1,
          type: "sentence",
          score: BREAK_SCORES.sentence,
        });
      }
    }

    offset += line.length + 1; // +1 for newline
  }

  return breakpoints;
}

function isInsideCodeBlock(text: string, position: number): boolean {
  const before = text.substring(0, position);
  const fenceCount = (before.match(/```/g) || []).length;
  return fenceCount % 2 !== 0;
}

function scoredBreakpoint(bp: Breakpoint, targetPosition: number): number {
  const distance = Math.abs(bp.index - targetPosition);
  const distancePenalty = (distance / TARGET_CHARS) ** 2;
  return bp.score - distancePenalty * 50;
}

export function chunkMarkdown(text: string): Chunk[] {
  if (text.length <= TARGET_CHARS) {
    return [{ seq: 0, text, charOffset: 0 }];
  }

  const breakpoints = findBreakpoints(text);
  const chunks: Chunk[] = [];
  let start = 0;
  let seq = 0;

  while (start < text.length) {
    if (text.length - start <= TARGET_CHARS) {
      chunks.push({ seq, text: text.substring(start), charOffset: start });
      break;
    }

    const targetEnd = start + TARGET_CHARS;

    // Find best breakpoint near target
    const candidates = breakpoints
      .filter((bp) => bp.index > start + TARGET_CHARS * 0.5 && bp.index < start + TARGET_CHARS * 1.5)
      .filter((bp) => !isInsideCodeBlock(text, bp.index))
      .map((bp) => ({ ...bp, finalScore: scoredBreakpoint(bp, targetEnd) }))
      .sort((a, b) => b.finalScore - a.finalScore);

    const splitAt = candidates.length > 0 ? candidates[0].index : targetEnd;

    chunks.push({ seq, text: text.substring(start, splitAt), charOffset: start });

    // Move start back by overlap
    start = splitAt - OVERLAP_CHARS;
    if (start <= chunks[chunks.length - 1].charOffset) {
      start = splitAt; // Prevent infinite loop
    }
    seq++;
  }

  return chunks;
}
