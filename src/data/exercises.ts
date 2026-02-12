import type { ExerciseConfig } from "@/types/exercise";

export const EXERCISES: ExerciseConfig[] = [
  {
    id: "one-minute-explainer",
    name: "One-Minute Explainer",
    description:
      "Explain a concept in 60 seconds with a clear beginning, middle, and end for someone unfamiliar with it.",
    shortDescription: "Build fast structure and clear delivery under time pressure.",
    estimatedTime: 180,
    type: "verbal",
    category: "clarity",
    tier: "foundation",
    icon: "target",
    impactsScores: ["clarity", "fluency"],
  },
  {
    id: "progressive-detail-expansion",
    name: "Progressive Detail Expansion",
    description:
      "Explain the same topic in 15, 30, and 60 seconds to train prioritization and adaptive depth.",
    shortDescription: "Scale your explanation depth for different time windows.",
    estimatedTime: 300,
    type: "verbal",
    category: "clarity",
    tier: "adaptive",
    icon: "layers",
    impactsScores: ["clarity", "precision"],
  },
  {
    id: "impromptu-response",
    name: "Impromptu Response",
    description:
      "You get a surprise prompt and 5 seconds to think before responding. Builds composure under pressure.",
    shortDescription: "Think fast and speak with structure.",
    estimatedTime: 120,
    type: "verbal",
    category: "impact",
    tier: "adaptive",
    icon: "mic",
    impactsScores: ["clarity", "confidence", "impact"],
  },
  {
    id: "eliminate-meandering",
    name: "Eliminate Meandering",
    description:
      "Record one version, review the transcript, then re-record the same message with fewer words and less clutter.",
    shortDescription: "Say the same thing with fewer words and more clarity.",
    estimatedTime: 300,
    type: "verbal",
    category: "clarity",
    tier: "foundation",
    icon: "scissors",
    impactsScores: ["clarity", "precision"],
  },
  {
    id: "structure-template",
    name: "Structure Template Challenge",
    description:
      "Use an argument framework: position, three reasons, counterpoint, and restated position.",
    shortDescription: "Practice structured speaking with repeatable argument patterns.",
    estimatedTime: 240,
    type: "verbal",
    category: "clarity",
    tier: "foundation",
    icon: "layout-list",
    impactsScores: ["clarity", "confidence"],
  },
  {
    id: "filler-words",
    name: "Filler Word Cleanup",
    description:
      "Speak naturally while the system detects filler words. Focus on pacing and intentional pauses.",
    shortDescription: "Reduce filler words and improve fluency.",
    estimatedTime: 60,
    type: "verbal",
    category: "fluency",
    tier: "foundation",
    icon: "message-circle",
    impactsScores: ["fluency", "clarity"],
  },
  {
    id: "dead-phrase-autopsy",
    name: "Dead Phrase Autopsy",
    description:
      "Replace cliches and dead phrases with fresh, precise wording that reflects your real meaning.",
    shortDescription: "Swap cliches for specific and original language.",
    estimatedTime: 180,
    type: "written",
    category: "precision",
    tier: "foundation",
    icon: "filter",
    impactsScores: ["precision", "clarity"],
  },
  {
    id: "synonym-discrimination",
    name: "Synonym Discrimination",
    description:
      "Choose context-best synonyms and explain your choice to sharpen nuance in word selection.",
    shortDescription: "Train precise word choice through contextual contrasts.",
    estimatedTime: 240,
    type: "written",
    category: "precision",
    tier: "adaptive",
    icon: "git-compare",
    impactsScores: ["precision", "impact"],
  },
  {
    id: "connotation-unpacking",
    name: "Connotation Unpacking",
    description:
      "Rewrite the same sentence with positive, negative, and neutral tone to master emotional shading.",
    shortDescription: "Learn how connotation changes meaning and tone.",
    estimatedTime: 300,
    type: "written",
    category: "precision",
    tier: "adaptive",
    icon: "palette",
    impactsScores: ["precision", "impact"],
  },
  {
    id: "expansion-challenge",
    name: "The Expansion Challenge",
    description:
      "Expand vague, generic sentences into specific, concrete language that conveys exact meaning.",
    shortDescription: "Replace generic words with specific details.",
    estimatedTime: 180,
    type: "written",
    category: "precision",
    tier: "foundation",
    icon: "expand",
    impactsScores: ["precision", "clarity"],
  },
  {
    id: "blue-sky-detector",
    name: "Blue Sky Detector",
    description:
      "Identify statements that add no new information and distinguish them from substantive claims.",
    shortDescription: "Spot empty language and prioritize substance.",
    estimatedTime: 240,
    type: "written",
    category: "precision",
    tier: "adaptive",
    icon: "scan-search",
    impactsScores: ["precision", "clarity"],
  },
  {
    id: "contextual-vocabulary",
    name: "Contextual Vocabulary Building",
    description:
      "Apply highlighted words from quality writing in new contexts and define them in your own words.",
    shortDescription: "Move words from passive recognition to active usage.",
    estimatedTime: 360,
    type: "written",
    category: "precision",
    tier: "adaptive",
    icon: "book-open",
    impactsScores: ["precision", "impact"],
  },
  {
    id: "precision-pyramid",
    name: "Precision Pyramid",
    description:
      "Rewrite a broad statement through five increasingly specific iterations while staying concise.",
    shortDescription: "Practice moving from broad to specific claims.",
    estimatedTime: 300,
    type: "written",
    category: "precision",
    tier: "adaptive",
    icon: "triangle",
    impactsScores: ["precision", "clarity"],
  },
  {
    id: "emotional-bridging",
    name: "Emotional Bridging Practice",
    description:
      "Convert abstract concepts into concrete, relatable moments with emotional resonance.",
    shortDescription: "Make abstract ideas vivid and relatable.",
    estimatedTime: 240,
    type: "written",
    category: "impact",
    tier: "adaptive",
    icon: "heart",
    impactsScores: ["impact", "precision"],
  },
];

export function getExerciseById(id: string): ExerciseConfig | undefined {
  return EXERCISES.find((exercise) => exercise.id === id);
}

export function getExercisesByCategory(category: string): ExerciseConfig[] {
  return EXERCISES.filter((exercise) => exercise.category === category);
}

export function getFoundationExercises(): ExerciseConfig[] {
  return EXERCISES.filter((exercise) => exercise.tier === "foundation");
}
