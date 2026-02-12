import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID, type AchievementDefinition } from "@/data/achievements";
import { EXERCISES } from "@/data/exercises";
import type { CommunicationSubscore, ExerciseAttempt, UserProgress } from "@/types/exercise";

const PROGRESS_KEY_PREFIX = "user_progress:";

function safeGetProgressRaw(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(`${PROGRESS_KEY_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

function safeSetProgressRaw(userId: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${PROGRESS_KEY_PREFIX}${userId}`, value);
  } catch {
    // ignore storage write failures
  }
}

function attemptCountByExercise(attempts: ExerciseAttempt[]): Record<string, number> {
  return attempts.reduce(
    (acc, attempt) => {
      acc[attempt.exerciseId] = (acc[attempt.exerciseId] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

function categoryCompletionByExercise(attempts: ExerciseAttempt[]): Record<string, boolean> {
  return attempts.reduce(
    (acc, attempt) => {
      acc[attempt.exerciseId] = true;
      return acc;
    },
    {} as Record<string, boolean>
  );
}

function hasImprovementOfAtLeast(
  attempts: ExerciseAttempt[],
  subscore: CommunicationSubscore,
  target: number
): boolean {
  let minSeen = Number.POSITIVE_INFINITY;
  let maxSeen = Number.NEGATIVE_INFINITY;

  attempts.forEach((attempt) => {
    const value = attempt.impactedScores[subscore];
    if (typeof value !== "number") return;
    if (value < minSeen) minSeen = value;
    if (value > maxSeen) maxSeen = value;
  });

  if (!Number.isFinite(minSeen) || !Number.isFinite(maxSeen)) return false;
  return maxSeen - minSeen >= target;
}

function isUnlocked(
  achievement: AchievementDefinition,
  progress: UserProgress,
  attempts: ExerciseAttempt[]
): boolean {
  switch (achievement.kind) {
    case "streak":
      return progress.currentStreak >= (achievement.target ?? 0);
    case "sessions":
      return progress.totalSessions >= (achievement.target ?? 0);
    case "score":
      return progress.communicationScore.overall >= (achievement.target ?? 0);
    case "improvement":
      return achievement.subscore
        ? hasImprovementOfAtLeast(attempts, achievement.subscore, achievement.target ?? 20)
        : false;
    case "exercise-mastery": {
      if (!achievement.exerciseId) return false;
      const counts = attemptCountByExercise(attempts);
      return (counts[achievement.exerciseId] ?? 0) >= (achievement.target ?? 10);
    }
    case "perfect":
      return attempts.some((attempt) => attempt.score >= (achievement.target ?? 100));
    case "category-mastery": {
      if (!achievement.category) return false;
      const inCategory = EXERCISES.filter((exercise) => exercise.category === achievement.category);
      if (inCategory.length === 0) return false;
      const completed = categoryCompletionByExercise(attempts);
      return inCategory.every((exercise) => completed[exercise.id]);
    }
    default:
      return false;
  }
}

export function getAchievementProgress(
  achievement: AchievementDefinition,
  progress: UserProgress,
  attempts: ExerciseAttempt[] = []
): { current: number; target: number } | null {
  switch (achievement.kind) {
    case "streak":
      return { current: progress.currentStreak, target: achievement.target ?? 1 };
    case "sessions":
      return { current: progress.totalSessions, target: achievement.target ?? 1 };
    case "score":
      return { current: progress.communicationScore.overall, target: achievement.target ?? 1 };
    case "exercise-mastery": {
      if (!achievement.exerciseId) return null;
      const counts = attemptCountByExercise(attempts);
      return { current: counts[achievement.exerciseId] ?? 0, target: achievement.target ?? 10 };
    }
    case "category-mastery": {
      if (!achievement.category) return null;
      const inCategory = EXERCISES.filter((exercise) => exercise.category === achievement.category);
      const completed = categoryCompletionByExercise(attempts);
      const current = inCategory.filter((exercise) => completed[exercise.id]).length;
      return { current, target: inCategory.length || 1 };
    }
    default:
      return null;
  }
}

export function checkAchievements(
  userProgress: UserProgress,
  attempts: ExerciseAttempt[] = []
): AchievementDefinition[] {
  const earned = new Set(userProgress.achievements);
  return ACHIEVEMENTS.filter(
    (achievement) => !earned.has(achievement.id) && isUnlocked(achievement, userProgress, attempts)
  );
}

export function hasAchievement(userId: string, achievementId: string): boolean {
  const raw = safeGetProgressRaw(userId);
  if (!raw) return false;
  try {
    const progress = JSON.parse(raw) as UserProgress;
    return Array.isArray(progress.achievements) && progress.achievements.includes(achievementId);
  } catch {
    return false;
  }
}

export function awardAchievement(userId: string, achievementId: string): boolean {
  const achievement = ACHIEVEMENT_BY_ID[achievementId];
  if (!achievement) return false;
  const raw = safeGetProgressRaw(userId);
  if (!raw) return false;

  try {
    const progress = JSON.parse(raw) as UserProgress;
    const achievements = Array.isArray(progress.achievements) ? [...progress.achievements] : [];
    if (achievements.includes(achievementId)) return false;
    achievements.push(achievementId);
    progress.achievements = achievements;
    progress.totalXP = (progress.totalXP ?? 0) + achievement.xpReward;
    safeSetProgressRaw(userId, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function getAchievementById(id: string): AchievementDefinition | null {
  return ACHIEVEMENT_BY_ID[id] ?? null;
}
