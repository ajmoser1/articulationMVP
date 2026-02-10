/**
 * Structural analysis for impromptu responses.
 * Detects position statements and supporting phrases like "because," "however," "for instance."
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StructuralElementPosition {
  phrase: string;
  position: number;
  category: "position" | "supporting";
}

export interface StructuralAnalysisResult {
  positionStatements: StructuralElementPosition[];
  supportingPhrases: StructuralElementPosition[];
  allElements: StructuralElementPosition[];
  positionCount: number;
  supportingCount: number;
  totalStructuralElements: number;
  elementsPerMinute: number;
  insight: string;
}

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

/** Phrases that signal the speaker is stating a position or opinion */
const POSITION_PHRASES = [
  "i believe",
  "i think",
  "in my opinion",
  "i feel that",
  "i would say",
  "from my perspective",
  "i'd say",
  "my view is",
  "i argue that",
  "it seems to me",
  "in my view",
  "personally",
  "to my mind",
  "as i see it",
  "i maintain that",
  "i contend that",
] as const;

/** Phrases that support an argument (reasoning, examples, contrast) */
const SUPPORTING_PHRASES = [
  "because",
  "however",
  "for instance",
  "for example",
  "on the other hand",
  "in addition",
  "furthermore",
  "moreover",
  "therefore",
  "thus",
  "as a result",
  "specifically",
  "in other words",
  "that said",
  "nevertheless",
  "despite this",
  "in contrast",
  "by contrast",
  "alternatively",
  "such as",
  "like when",
  "the reason",
  "which means",
  "so that",
  "in order to",
  "this shows",
  "this means",
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findPhraseMatches(
  transcript: string,
  phrases: readonly string[],
  category: "position" | "supporting"
): StructuralElementPosition[] {
  const normalized = transcript.toLowerCase();
  const results: StructuralElementPosition[] = [];

  for (const phrase of phrases) {
    const escaped = escapeRegex(phrase);
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(transcript)) !== null) {
      results.push({
        phrase: m[0],
        position: m.index,
        category,
      });
    }
  }

  return results.sort((a, b) => a.position - b.position);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyzes a transcript for structural elements: position statements and
 * supporting phrases (e.g., "because," "however," "for instance").
 *
 * @param transcript - Full transcript text
 * @param durationMinutes - Duration in minutes (for elements-per-minute metric)
 */
export function analyzeStructuralElements(
  transcript: string,
  durationMinutes: number = 1
): StructuralAnalysisResult {
  const positionStatements = findPhraseMatches(
    transcript,
    POSITION_PHRASES,
    "position"
  );
  const supportingPhrases = findPhraseMatches(
    transcript,
    SUPPORTING_PHRASES,
    "supporting"
  );

  const allElements = [...positionStatements, ...supportingPhrases].sort(
    (a, b) => a.position - b.position
  );

  const totalStructuralElements =
    positionStatements.length + supportingPhrases.length;
  const elementsPerMinute =
    durationMinutes > 0 ? totalStructuralElements / durationMinutes : 0;

  const insight = getStructuralInsight(
    positionStatements.length,
    supportingPhrases.length,
    totalStructuralElements
  );

  return {
    positionStatements,
    supportingPhrases,
    allElements,
    positionCount: positionStatements.length,
    supportingCount: supportingPhrases.length,
    totalStructuralElements,
    elementsPerMinute,
    insight,
  };
}

function getStructuralInsight(
  positionCount: number,
  supportingCount: number,
  total: number
): string {
  if (total === 0) {
    return "Try using phrases like 'I believe' or 'in my opinion' to state your position, and 'because' or 'for instance' to support it.";
  }
  if (positionCount === 0 && supportingCount > 0) {
    return "You used supporting phrases well. Consider starting with a clear position (e.g., 'I believe...') to frame your response.";
  }
  if (positionCount > 0 && supportingCount === 0) {
    return "You stated your position clearly. Try adding supporting phrases like 'because,' 'for example,' or 'however' to strengthen your argument.";
  }
  if (positionCount >= 1 && supportingCount >= 2) {
    return "Strong structure: you stated your position and backed it up with reasoning and examples.";
  }
  return "Good start. Adding more supporting phrases like 'because' and 'for instance' will make your argument more persuasive.";
}
