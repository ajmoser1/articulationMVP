import { useCallback, useEffect, useMemo, useState } from "react";
import { getUserProgress, refreshStreak } from "@/utils/storage";

export interface UseStreakResult {
  currentStreak: number;
  longestStreak: number;
  hasPracticedToday: boolean;
  isAtRisk: boolean;
  refresh: () => void;
}

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function useStreak(userId = "default"): UseStreakResult {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lastPracticeDate, setLastPracticeDate] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const synced = refreshStreak(userId);
    setCurrentStreak(synced.currentStreak);
    setLongestStreak(synced.longestStreak);
    setLastPracticeDate(synced.lastPracticeDate);
  }, [userId]);

  useEffect(() => {
    const progress = getUserProgress(userId);
    setCurrentStreak(progress.currentStreak);
    setLongestStreak(progress.longestStreak);
    setLastPracticeDate(progress.lastPracticeDate);
    refresh();
  }, [userId, refresh]);

  const hasPracticedToday = useMemo(
    () => lastPracticeDate === todayKey(),
    [lastPracticeDate]
  );

  const isAtRisk = useMemo(() => {
    const hour = new Date().getHours();
    return !hasPracticedToday && currentStreak > 0 && hour >= 18;
  }, [hasPracticedToday, currentStreak]);

  return {
    currentStreak,
    longestStreak,
    hasPracticedToday,
    isAtRisk,
    refresh,
  };
}
