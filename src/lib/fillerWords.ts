/**
 * Filler word detection and analysis system.
 * Categorizes fillers, counts them, and analyzes distribution across the transcript.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Category names for filler word groups */
export type FillerCategory =
  | "hesitation"
  | "discourse"
  | "temporal"
  | "thinking";

/** Location of a single filler occurrence (character index in transcript) */
export interface FillerPosition {
  word: string;
  position: number;
}

/** Count of fillers in each third of the transcript */
export interface DistributionAnalysis {
  beginning: number;
  middle: number;
  end: number;
}

/** Full result of analyzeFillerWords() */
export interface FillerAnalysisResult {
  totalFillerWords: number;
  fillersPerMinute: number;
  categoryCounts: Record<FillerCategory, number>;
  specificFillerCounts: Record<string, number>;
  fillerPositions: FillerPosition[];
  distributionAnalysis: DistributionAnalysis;
}

/** Internal: a match with position and length for overlap handling */
interface MatchWithLength {
  word: string;
  category: FillerCategory;
  position: number;
  length: number;
}

// ---------------------------------------------------------------------------
// Filler word categories (canonical lowercase for matching)
// ---------------------------------------------------------------------------

export const FILLER_CATEGORIES: Record<FillerCategory, readonly string[]> = {
  hesitation: ["um", "uh", "er", "ah", "hmm"],
  discourse: [
    "like",
    "you know",
    "i mean",
    "sort of",
    "kind of",
    "basically",
    "actually",
    "literally",
  ],
  temporal: ["so", "well", "now", "then", "okay", "alright"],
  thinking: ["let me think", "let me see", "how do i say"],
} as const;

/** All category keys for iterating */
const CATEGORY_KEYS: FillerCategory[] = [
  "hesitation",
  "discourse",
  "temporal",
  "thinking",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape special regex characters in a string (e.g. "kind of" has no special, "how do I say" has no special in JS regex) */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a regex that matches the filler with word boundaries.
 * - Single word: \bword\b (allows optional punctuation adjacent)
 * - Multi-word: \bword1\s+word2\s+...\b
 * Uses 'gi' when compiled for case-insensitive, global matching.
 */
function patternForFiller(filler: string): RegExp {
  if (filler.includes(" ")) {
    const parts = filler.split(/\s+/).map((p) => escapeRegex(p));
    const withBoundaries = parts.join("\\s+");
    return new RegExp(`\\b${withBoundaries}\\b`, "gi");
  }
  const escaped = escapeRegex(filler);
  return new RegExp(`\\b${escaped}\\b`, "gi");
}

/**
 * Find all non-overlapping filler matches, with multi-word phrases preferred
 * over single-word matches that would overlap. Returns matches sorted by position.
 */
function findAllFillerMatches(transcript: string): MatchWithLength[] {
  const normalized = transcript;
  const matches: MatchWithLength[] = [];

  // Collect matches: multi-word first (thinking, then discourse phrases), then single words.
  // Order matters so we match "let me think" before "let", "me", "think".
  const order: { filler: string; category: FillerCategory }[] = [];
  for (const cat of CATEGORY_KEYS) {
    const list = FILLER_CATEGORIES[cat];
    for (const f of list) {
      order.push({ filler: f, category: cat });
    }
  }
  // Sort so longer phrases come first (so "let me think" before "like")
  order.sort((a, b) => b.filler.length - a.filler.length);

  for (const { filler, category } of order) {
    const re = patternForFiller(filler);
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(normalized)) !== null) {
      const position = m.index;
      const length = m[0].length;
      matches.push({ word: m[0], category, position, length });
    }
  }

  // Sort by position, then by length descending (prefer longer match at same start)
  matches.sort((a, b) => a.position - b.position || b.length - a.length);

  // Remove overlaps: keep each match only if it doesn't start before the end of the previous kept match
  const nonOverlapping: MatchWithLength[] = [];
  let lastEnd = -1;
  for (const match of matches) {
    if (match.position >= lastEnd) {
      nonOverlapping.push(match);
      lastEnd = match.position + match.length;
    }
  }

  return nonOverlapping;
}

/**
 * Compute distribution: count fillers in first third, middle third, and last third of transcript (by character position).
 */
function computeDistribution(
  transcriptLength: number,
  positions: number[]
): DistributionAnalysis {
  if (transcriptLength <= 0) {
    return { beginning: 0, middle: 0, end: 0 };
  }
  const third = transcriptLength / 3;
  let beginning = 0;
  let middle = 0;
  let end = 0;
  for (const pos of positions) {
    if (pos < third) beginning++;
    else if (pos < 2 * third) middle++;
    else end++;
  }
  return { beginning, middle, end };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyzes a transcript for filler words: counts by category and by specific filler,
 * records positions, and analyzes distribution across beginning/middle/end thirds.
 *
 * - Case-insensitive.
 * - Uses word boundaries (e.g. "like" is not matched in "likely").
 * - Handles punctuation (word boundary treats punctuation as non-word).
 * - Multi-word fillers (e.g. "let me think") are detected as full phrases; overlapping
 *   single-word matches are not double-counted.
 *
 * @param transcript - Full transcript text
 * @param durationMinutes - Duration in minutes (used for fillersPerMinute; use 1 if unknown)
 * @returns FillerAnalysisResult with counts, positions, and distribution
 */
export function analyzeFillerWords(
  transcript: string,
  durationMinutes: number
): FillerAnalysisResult {
  const matches = findAllFillerMatches(transcript);

  const totalFillerWords = matches.length;
  const fillersPerMinute =
    durationMinutes > 0 ? totalFillerWords / durationMinutes : 0;

  const categoryCounts: Record<FillerCategory, number> = {
    hesitation: 0,
    discourse: 0,
    temporal: 0,
    thinking: 0,
  };
  const specificFillerCounts: Record<string, number> = {};
  const fillerPositions: FillerPosition[] = [];
  const positionsForDistribution: number[] = [];

  for (const m of matches) {
    categoryCounts[m.category]++;
    const key = m.word.toLowerCase();
    specificFillerCounts[key] = (specificFillerCounts[key] ?? 0) + 1;
    fillerPositions.push({ word: m.word, position: m.position });
    positionsForDistribution.push(m.position);
  }

  const distributionAnalysis = computeDistribution(
    transcript.length,
    positionsForDistribution
  );

  return {
    totalFillerWords,
    fillersPerMinute,
    categoryCounts,
    specificFillerCounts,
    fillerPositions,
    distributionAnalysis,
  };
}
