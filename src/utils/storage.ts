import type {
  CommunicationScore,
  CommunicationSubscore,
  ExerciseAttempt,
  UserArchetype,
  UserProgress,
} from "@/types/exercise";
import { determineArchetype, DEFAULT_ARCHETYPE } from "@/data/archetypes";
import { ACHIEVEMENTS } from "@/data/achievements";
import { checkAchievements } from "@/utils/achievements";

const PROGRESS_KEY_PREFIX = "user_progress:";
const ATTEMPTS_KEY_PREFIX = "exercise_attempts:";
const STREAK_MILESTONES = [7, 14, 30, 60, 100] as const;

function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = "__storage_test__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function safeGetItem(key: string): string | null {
  if (!isStorageAvailable()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore quota / privacy errors.
  }
}

function safeRemoveItem(key: string): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore quota / privacy errors.
  }
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateDiffInDays(a: string, b: string): number {
  const aDate = new Date(`${a}T00:00:00Z`);
  const bDate = new Date(`${b}T00:00:00Z`);
  const diff = bDate.getTime() - aDate.getTime();
  return Math.round(diff / (24 * 60 * 60 * 1000));
}

function defaultScore(): CommunicationScore {
  return {
    overall: 0,
    fluency: null,
    clarity: null,
    precision: null,
    confidence: null,
    impact: null,
    lastUpdated: new Date(),
  };
}

function defaultProgress(userId: string): UserProgress {
  const score = defaultScore();
  const archetype = determineArchetype(score) ?? DEFAULT_ARCHETYPE;
  return {
    userId,
    communicationScore: score,
    archetype,
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: null,
    totalXP: 0,
    totalSessions: 0,
    totalPracticeTime: 0,
    achievements: [],
  };
}

function parseProgress(raw: string | null, userId: string): UserProgress {
  if (!raw) return defaultProgress(userId);
  try {
    const parsed = JSON.parse(raw) as UserProgress;
    const score = parsed.communicationScore;
    const migratedAchievements = (Array.isArray(parsed.achievements) ? parsed.achievements : []).map(
      (achievement) => {
        if (achievement === "🔥 7-Day Streak") return "streak-7";
        if (achievement === "🔥 14-Day Streak") return "streak-14";
        if (achievement === "🔥 30-Day Streak") return "streak-30";
        if (achievement === "🔥 60-Day Streak") return "streak-60";
        if (achievement === "🔥 100-Day Streak") return "streak-100";
        return achievement;
      }
    );
    return {
      ...parsed,
      userId,
      achievements: [...new Set(migratedAchievements)],
      communicationScore: {
        ...score,
        lastUpdated: new Date(score.lastUpdated),
      },
    };
  } catch {
    return defaultProgress(userId);
  }
}

function parseAttempts(raw: string | null): ExerciseAttempt[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ExerciseAttempt[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((attempt) => ({
      ...attempt,
      timestamp: new Date(attempt.timestamp),
    }));
  } catch {
    return [];
  }
}

function setProgress(userId: string, progress: UserProgress): void {
  safeSetItem(`${PROGRESS_KEY_PREFIX}${userId}`, JSON.stringify(progress));
}

function setAttempts(userId: string, attempts: ExerciseAttempt[]): void {
  safeSetItem(`${ATTEMPTS_KEY_PREFIX}${userId}`, JSON.stringify(attempts));
}

export function saveUserProgress(userId: string, progress: UserProgress): void {
  setProgress(userId, progress);
}

export function getUserProgress(userId: string): UserProgress {
  const raw = safeGetItem(`${PROGRESS_KEY_PREFIX}${userId}`);
  return parseProgress(raw, userId);
}

function persistAttempt(userId: string, attempt: ExerciseAttempt): void {
  const attempts = getExerciseHistory(userId);
  attempts.push(attempt);
  setAttempts(userId, attempts);
}

export function saveExerciseAttempt(
  userId: string,
  attempt: ExerciseAttempt,
  archetypeOverride?: UserArchetype
): UserProgress {
  return updateProgressAfterExercise(userId, attempt, archetypeOverride);
}

export function getExerciseHistory(userId: string): ExerciseAttempt[] {
  const raw = safeGetItem(`${ATTEMPTS_KEY_PREFIX}${userId}`);
  return parseAttempts(raw);
}

export function getExerciseAttempts(userId: string, exerciseId: string): ExerciseAttempt[] {
  return getExerciseHistory(userId).filter((attempt) => attempt.exerciseId === exerciseId);
}

export function clearUserProgressData(userId: string): void {
  safeRemoveItem(`${PROGRESS_KEY_PREFIX}${userId}`);
  safeRemoveItem(`${ATTEMPTS_KEY_PREFIX}${userId}`);
}

export function refreshStreak(userId: string, referenceDate = new Date()): UserProgress {
  const progress = getUserProgress(userId);
  if (!progress.lastPracticeDate) return progress;

  const today = toDateKey(referenceDate);
  const diff = dateDiffInDays(progress.lastPracticeDate, today);
  if (diff <= 1) return progress;

  const reset: UserProgress = {
    ...progress,
    currentStreak: 0,
  };
  setProgress(userId, reset);
  return reset;
}

export function updateStreak(progress: UserProgress, practiceDate = new Date()): UserProgress {
  const today = toDateKey(practiceDate);
  const last = progress.lastPracticeDate;

  if (!last) {
    const next = {
      ...progress,
      currentStreak: 1,
      longestStreak: Math.max(1, progress.longestStreak),
      lastPracticeDate: today,
    };
    return next;
  }

  const diff = dateDiffInDays(last, today);
  if (diff === 0) return progress;
  if (diff === 1) {
    const currentStreak = progress.currentStreak + 1;
    return {
      ...progress,
      currentStreak,
      longestStreak: Math.max(progress.longestStreak, currentStreak),
      lastPracticeDate: today,
    };
  }

  return {
    ...progress,
    currentStreak: 1,
    lastPracticeDate: today,
    longestStreak: Math.max(progress.longestStreak, 1),
  };
}

function recalcOverall(score: CommunicationScore): number {
  const values: number[] = [];
  const keys: CommunicationSubscore[] = ["fluency", "clarity", "precision", "confidence", "impact"];
  keys.forEach((key) => {
    const value = score[key];
    if (typeof value === "number") values.push(value);
  });
  if (values.length === 0) return score.overall;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function updateProgressAfterExercise(
  userId: string,
  attempt: ExerciseAttempt,
  archetypeOverride?: UserArchetype
): UserProgress {
  let progress = getUserProgress(userId);
  const previousStreak = progress.currentStreak;
  progress = updateStreak(progress, attempt.timestamp);
  const milestone = STREAK_MILESTONES.find(
    (target) => previousStreak < target && progress.currentStreak >= target
  );

  const updatedScore = { ...progress.communicationScore };
  Object.entries(attempt.impactedScores).forEach(([subscore, value]) => {
    const key = subscore as CommunicationSubscore;
    const current = updatedScore[key];
    const nextValue =
      typeof current === "number" ? Math.round(current * 0.7 + value * 0.3) : value;
    updatedScore[key] = Math.max(0, Math.min(100, nextValue));
  });

  updatedScore.overall = recalcOverall(updatedScore);
  updatedScore.lastUpdated = new Date();

  let nextProgress: UserProgress = {
    ...progress,
    communicationScore: updatedScore,
    totalXP: progress.totalXP + attempt.xpEarned,
    totalSessions: progress.totalSessions + 1,
    totalPracticeTime: progress.totalPracticeTime + attempt.duration,
    achievements: [...progress.achievements],
  };

  if (milestone) {
    const streakAchievement = ACHIEVEMENTS.find(
      (achievement) => achievement.kind === "streak" && achievement.target === milestone
    );
    if (streakAchievement && !nextProgress.achievements.includes(streakAchievement.id)) {
      nextProgress.achievements.push(streakAchievement.id);
      nextProgress.totalXP += streakAchievement.xpReward;
    }
  }

  nextProgress.archetype = archetypeOverride ?? determineArchetype(nextProgress.communicationScore) ?? DEFAULT_ARCHETYPE;

  const attemptHistory = [...getExerciseHistory(userId), attempt];
  const newlyUnlocked = checkAchievements(nextProgress, attemptHistory);
  if (newlyUnlocked.length > 0) {
    const unlockedIds = new Set(nextProgress.achievements);
    newlyUnlocked.forEach((achievement) => {
      if (unlockedIds.has(achievement.id)) return;
      nextProgress.achievements.push(achievement.id);
      nextProgress.totalXP += achievement.xpReward;
      unlockedIds.add(achievement.id);
    });
  }

  setProgress(userId, nextProgress);
  persistAttempt(userId, attempt);

  return nextProgress;
}
