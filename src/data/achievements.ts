export type AchievementKind =
  | "streak"
  | "sessions"
  | "score"
  | "improvement"
  | "exercise-mastery"
  | "perfect"
  | "category-mastery";

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  xpReward: number;
  kind: AchievementKind;
  target?: number;
  subscore?: "fluency" | "clarity" | "precision" | "confidence" | "impact";
  exerciseId?: string;
  category?: string;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "streak-3", name: "3-Day Streak", description: "Practice 3 days in a row.", icon: "🔥", requirement: "Reach a 3-day streak", xpReward: 30, kind: "streak", target: 3 },
  { id: "streak-7", name: "7-Day Streak", description: "Keep your streak alive for a full week.", icon: "🔥🎉", requirement: "Reach a 7-day streak", xpReward: 70, kind: "streak", target: 7 },
  { id: "streak-14", name: "14-Day Streak", description: "Two weeks of consistency.", icon: "🔥🎉", requirement: "Reach a 14-day streak", xpReward: 120, kind: "streak", target: 14 },
  { id: "streak-30", name: "30-Day Streak", description: "A full month of daily reps.", icon: "🏆", requirement: "Reach a 30-day streak", xpReward: 300, kind: "streak", target: 30 },
  { id: "streak-60", name: "60-Day Streak", description: "Elite consistency.", icon: "🏆", requirement: "Reach a 60-day streak", xpReward: 500, kind: "streak", target: 60 },
  { id: "streak-100", name: "100-Day Streak", description: "Legendary commitment.", icon: "👑", requirement: "Reach a 100-day streak", xpReward: 1000, kind: "streak", target: 100 },

  { id: "sessions-10", name: "10 Sessions", description: "Build your first habit loop.", icon: "📈", requirement: "Complete 10 sessions", xpReward: 50, kind: "sessions", target: 10 },
  { id: "sessions-25", name: "25 Sessions", description: "Strong momentum established.", icon: "📈", requirement: "Complete 25 sessions", xpReward: 100, kind: "sessions", target: 25 },
  { id: "sessions-50", name: "50 Sessions", description: "You show up consistently.", icon: "📈", requirement: "Complete 50 sessions", xpReward: 180, kind: "sessions", target: 50 },
  { id: "sessions-100", name: "100 Sessions", description: "Triple-digit reps achieved.", icon: "🚀", requirement: "Complete 100 sessions", xpReward: 350, kind: "sessions", target: 100 },
  { id: "sessions-250", name: "250 Sessions", description: "Master-level dedication.", icon: "🚀", requirement: "Complete 250 sessions", xpReward: 800, kind: "sessions", target: 250 },

  { id: "score-70", name: "Rising Communicator", description: "Reach 70 overall communication score.", icon: "⭐", requirement: "Reach 70 overall score", xpReward: 100, kind: "score", target: 70 },
  { id: "score-80", name: "Confident Communicator", description: "Reach 80 overall communication score.", icon: "🌟", requirement: "Reach 80 overall score", xpReward: 180, kind: "score", target: 80 },
  { id: "score-90", name: "Elite Communicator", description: "Reach 90 overall communication score.", icon: "✨", requirement: "Reach 90 overall score", xpReward: 300, kind: "score", target: 90 },

  { id: "improve-fluency-20", name: "Fluency Leap", description: "Improve fluency by 20+ points.", icon: "🧠", requirement: "Fluency +20", xpReward: 120, kind: "improvement", target: 20, subscore: "fluency" },
  { id: "improve-clarity-20", name: "Clarity Leap", description: "Improve clarity by 20+ points.", icon: "🎯", requirement: "Clarity +20", xpReward: 120, kind: "improvement", target: 20, subscore: "clarity" },
  { id: "improve-precision-20", name: "Precision Leap", description: "Improve precision by 20+ points.", icon: "🛠️", requirement: "Precision +20", xpReward: 120, kind: "improvement", target: 20, subscore: "precision" },
  { id: "improve-confidence-20", name: "Confidence Leap", description: "Improve confidence by 20+ points.", icon: "💪", requirement: "Confidence +20", xpReward: 120, kind: "improvement", target: 20, subscore: "confidence" },
  { id: "improve-impact-20", name: "Impact Leap", description: "Improve impact by 20+ points.", icon: "📣", requirement: "Impact +20", xpReward: 120, kind: "improvement", target: 20, subscore: "impact" },

  { id: "master-filler-words", name: "Filler Specialist", description: "Complete Filler Word Cleanup 10 times.", icon: "🎤", requirement: "10x Filler Word Cleanup", xpReward: 150, kind: "exercise-mastery", target: 10, exerciseId: "filler-words" },
  { id: "master-one-minute-explainer", name: "Explainer Specialist", description: "Complete One-Minute Explainer 10 times.", icon: "🗣️", requirement: "10x One-Minute Explainer", xpReward: 150, kind: "exercise-mastery", target: 10, exerciseId: "one-minute-explainer" },
  { id: "master-eliminate-meandering", name: "Precision Specialist", description: "Complete Eliminate Meandering 10 times.", icon: "🧭", requirement: "10x Eliminate Meandering", xpReward: 150, kind: "exercise-mastery", target: 10, exerciseId: "eliminate-meandering" },

  { id: "perfect-score", name: "Perfect Run", description: "Score 100/100 on any exercise.", icon: "💯", requirement: "100 score on any attempt", xpReward: 200, kind: "perfect", target: 100 },

  { id: "category-fluency-master", name: "Fluency Category Master", description: "Complete all fluency exercises.", icon: "🌊", requirement: "All fluency exercises completed", xpReward: 160, kind: "category-mastery", category: "fluency" },
  { id: "category-clarity-master", name: "Clarity Category Master", description: "Complete all clarity exercises.", icon: "🔎", requirement: "All clarity exercises completed", xpReward: 160, kind: "category-mastery", category: "clarity" },
  { id: "category-precision-master", name: "Precision Category Master", description: "Complete all precision exercises.", icon: "📐", requirement: "All precision exercises completed", xpReward: 160, kind: "category-mastery", category: "precision" },
  { id: "category-confidence-master", name: "Confidence Category Master", description: "Complete all confidence exercises.", icon: "🦁", requirement: "All confidence exercises completed", xpReward: 160, kind: "category-mastery", category: "confidence" },
  { id: "category-impact-master", name: "Impact Category Master", description: "Complete all impact exercises.", icon: "⚡", requirement: "All impact exercises completed", xpReward: 160, kind: "category-mastery", category: "impact" },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDefinition> = ACHIEVEMENTS.reduce(
  (acc, achievement) => {
    acc[achievement.id] = achievement;
    return acc;
  },
  {} as Record<string, AchievementDefinition>
);
