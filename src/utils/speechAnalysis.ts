import type { CommunicationSubscore } from "@/types/exercise";

export interface SpeechMetricBreakdown {
  score: number;
  signals: Record<string, number>;
  notes: string[];
}

export interface SpeechDiagnosticsResult {
  fluency: SpeechMetricBreakdown;
  clarity: SpeechMetricBreakdown;
  pace: SpeechMetricBreakdown;
  precision: SpeechMetricBreakdown;
  confidence: SpeechMetricBreakdown;
  impact: SpeechMetricBreakdown;
  subscores: Record<CommunicationSubscore, number>;
}

interface DiagnosticsOptions {
  fillerWordCount?: number;
}

const VAGUE_WORDS = new Set(["thing", "things", "stuff", "good", "bad", "really", "very"]);
const HEDGING_PHRASES = [
  "i think",
  "maybe",
  "kind of",
  "sort of",
  "probably",
  "i guess",
  "perhaps",
  "might be",
];
const CERTAINTY_WORDS = new Set(["clearly", "definitely", "certainly", "will", "must", "always"]);
const EXAMPLE_CUES = ["for example", "for instance", "like when", "such as"];
const STORY_CUES = ["once", "last week", "yesterday", "when i", "there was", "i remember"];
const ANALOGY_CUES = ["like", "as if", "similar to", "just as"];
const SENSORY_WORDS = new Set([
  "see",
  "saw",
  "look",
  "hear",
  "heard",
  "sound",
  "feel",
  "felt",
  "touch",
  "taste",
  "smell",
]);
const EMOTION_WORDS = new Set([
  "excited",
  "worried",
  "frustrated",
  "happy",
  "sad",
  "nervous",
  "proud",
  "confident",
  "afraid",
]);
const ABSTRACT_WORDS = new Set([
  "idea",
  "concept",
  "system",
  "process",
  "strategy",
  "approach",
  "value",
  "culture",
  "quality",
]);

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function wordsFrom(text: string): string[] {
  return (text.toLowerCase().match(/[a-z']+/g) ?? []).filter(Boolean);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function countCues(text: string, cues: string[]): number {
  const lower = text.toLowerCase();
  return cues.reduce((sum, cue) => sum + (lower.includes(cue) ? 1 : 0), 0);
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const sa = new Set(a);
  const sb = new Set(b);
  const intersection = [...sa].filter((w) => sb.has(w)).length;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : intersection / union;
}

function analyzeFluency(words: string[], durationMinutes: number, fillerWordCount: number): SpeechMetricBreakdown {
  const wpm = durationMinutes > 0 ? words.length / durationMinutes : 0;
  const fillerRate = words.length > 0 ? fillerWordCount / words.length : 0;
  const base = 100 - fillerWordCount * 2;
  const wpmPenalty = wpm < 90 || wpm > 190 ? 8 : 0;
  const score = clamp(base - wpmPenalty - fillerRate * 100);
  return {
    score,
    signals: { wpm, fillerWordCount, fillerRate },
    notes: [
      `Detected ${fillerWordCount} fillers.`,
      `Approximate speaking pace ${Math.round(wpm)} wpm.`,
    ],
  };
}

function analyzeClarity(sentences: string[], words: string[]): SpeechMetricBreakdown {
  const sentenceLengths = sentences.map((sentence) => wordsFrom(sentence).length).filter((n) => n > 0);
  const avgSentenceLength =
    sentenceLengths.length > 0
      ? sentenceLengths.reduce((sum, n) => sum + n, 0) / sentenceLengths.length
      : 0;

  let repeatedPairs = 0;
  for (let i = 1; i < sentences.length; i += 1) {
    const prevWords = wordsFrom(sentences[i - 1]);
    const currWords = wordsFrom(sentences[i]);
    if (jaccardSimilarity(prevWords, currWords) > 0.7) repeatedPairs += 1;
  }
  const repetitionRatio = sentences.length > 1 ? repeatedPairs / (sentences.length - 1) : 0;

  const uniqueWordCount = new Set(words).size;
  const coherenceScore = words.length > 0 ? clamp((uniqueWordCount / words.length) * 100, 0, 100) : 0;
  const lengthPenalty = avgSentenceLength > 24 || avgSentenceLength < 6 ? 12 : 0;
  const repetitionPenalty = repetitionRatio * 40;
  const score = clamp(78 + coherenceScore * 0.18 - repetitionPenalty - lengthPenalty);

  return {
    score,
    signals: {
      avgSentenceLength,
      repetitionRatio,
      topicCoherence: coherenceScore,
    },
    notes: [
      `Average sentence length: ${avgSentenceLength.toFixed(1)} words.`,
      repetitionRatio > 0.2 ? "Some repeated ideas were detected." : "Low repeated-idea signals.",
    ],
  };
}

function analyzePace(text: string, words: string[], durationMinutes: number): SpeechMetricBreakdown {
  const wpm = durationMinutes > 0 ? words.length / durationMinutes : 0;
  const pauses = (text.match(/[,.!?;:]/g) ?? []).length;
  const longPauses = (text.match(/\.\.\.|—|--/g) ?? []).length;
  const pauseFrequency = words.length > 0 ? (pauses + longPauses * 2) / words.length : 0;
  const optimalDistance = Math.abs(150 - wpm);
  const paceFit = clamp(100 - optimalDistance * 1.2);
  const consistency = clamp(100 - Math.abs(pauseFrequency - 0.08) * 500);
  const score = clamp(paceFit * 0.65 + consistency * 0.35);

  return {
    score,
    signals: {
      wordsPerMinute: wpm,
      pauseFrequency,
      estimatedLongPauses: longPauses,
      paceConsistency: consistency,
    },
    notes: [
      `Pace target is 140-160 wpm; estimated ${Math.round(wpm)} wpm.`,
      `Detected ${pauses + longPauses} pause markers.`,
    ],
  };
}

function analyzePrecision(words: string[]): SpeechMetricBreakdown {
  const uniqueWords = new Set(words).size;
  const vocabularyDiversity = words.length > 0 ? uniqueWords / words.length : 0;
  const vagueCount = words.reduce((sum, word) => sum + (VAGUE_WORDS.has(word) ? 1 : 0), 0);
  const concreteCount = words.reduce(
    (sum, word) => sum + (!ABSTRACT_WORDS.has(word) && word.length > 4 ? 1 : 0),
    0
  );
  const abstractCount = words.reduce((sum, word) => sum + (ABSTRACT_WORDS.has(word) ? 1 : 0), 0);
  const abstractConcreteRatio = concreteCount > 0 ? abstractCount / concreteCount : abstractCount;

  const score = clamp(vocabularyDiversity * 100 - vagueCount * 3 - abstractConcreteRatio * 8 + 35);

  return {
    score,
    signals: {
      vocabularyDiversity,
      vagueWordCount: vagueCount,
      abstractConcreteRatio,
      uniqueWords,
      totalWords: words.length,
    },
    notes: [
      `Vocabulary diversity ${(vocabularyDiversity * 100).toFixed(1)}%.`,
      vagueCount > 0 ? `${vagueCount} vague words detected.` : "No high-priority vague words detected.",
    ],
  };
}

function analyzeConfidence(text: string, words: string[]): SpeechMetricBreakdown {
  const lower = text.toLowerCase();
  const hedgingCount =
    HEDGING_PHRASES.reduce(
      (sum, phrase) => sum + ((lower.match(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length),
      0
    ) + words.filter((word) => word === "maybe").length;
  const certaintyCount = words.reduce((sum, word) => sum + (CERTAINTY_WORDS.has(word) ? 1 : 0), 0);
  const hedgingFrequency = words.length > 0 ? hedgingCount / words.length : 0;

  const score = clamp(100 - hedgingFrequency * 500 + certaintyCount * 2 - hedgingCount * 3);

  return {
    score,
    signals: {
      hedgingCount,
      certaintyWordCount: certaintyCount,
      hedgingFrequency,
    },
    notes: [
      hedgingCount > 0
        ? `Detected ${hedgingCount} hedging cues.`
        : "Low hedging language detected.",
      certaintyCount > 0 ? `${certaintyCount} certainty cues used.` : "Few certainty cues detected.",
    ],
  };
}

function analyzeImpact(text: string, words: string[]): SpeechMetricBreakdown {
  const examples = countCues(text, EXAMPLE_CUES);
  const stories = countCues(text, STORY_CUES);
  const analogies = countCues(text, ANALOGY_CUES);
  const sensory = words.reduce((sum, word) => sum + (SENSORY_WORDS.has(word) ? 1 : 0), 0);
  const emotional = words.reduce((sum, word) => sum + (EMOTION_WORDS.has(word) ? 1 : 0), 0);

  const score = clamp(52 + examples * 8 + stories * 10 + analogies * 8 + sensory * 1.5 + emotional * 2);

  return {
    score,
    signals: {
      exampleCues: examples,
      storyCues: stories,
      analogyCues: analogies,
      sensoryWords: sensory,
      emotionalWords: emotional,
    },
    notes: [
      `Examples: ${examples}, stories: ${stories}, analogies: ${analogies}.`,
      `Sensory/emotional language tokens: ${sensory + emotional}.`,
    ],
  };
}

export function analyzeSpeechDiagnostics(
  transcript: string,
  durationMinutes: number,
  options: DiagnosticsOptions = {}
): SpeechDiagnosticsResult {
  const words = wordsFrom(transcript);
  const sentences = splitSentences(transcript);
  const fillerWordCount = options.fillerWordCount ?? 0;

  const fluency = analyzeFluency(words, durationMinutes, fillerWordCount);
  const clarity = analyzeClarity(sentences, words);
  const pace = analyzePace(transcript, words, durationMinutes);
  const precision = analyzePrecision(words);
  const confidence = analyzeConfidence(transcript, words);
  const impact = analyzeImpact(transcript, words);

  return {
    fluency,
    clarity,
    pace,
    precision,
    confidence,
    impact,
    subscores: {
      fluency: fluency.score,
      clarity: clamp(clarity.score * 0.7 + pace.score * 0.3),
      precision: precision.score,
      confidence: confidence.score,
      impact: impact.score,
    },
  };
}
