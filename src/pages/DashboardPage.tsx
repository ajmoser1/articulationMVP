import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Sparkles,
  Trophy,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { FuturismBlock } from "@/components/ui/FuturismBlock";
import { Button } from "@/components/ui/button";
import { EXERCISES, getExerciseById } from "@/data/exercises";
import { getExerciseHistory, getUserProgress, saveUserProgress } from "@/utils/storage";
import type { CommunicationSubscore, ExerciseAttempt, UserProgress } from "@/types/exercise";
import { QuickPracticeModal } from "@/components/QuickPracticeModal";
import { useStreak } from "@/hooks/useStreak";
import { StreakWarning } from "@/components/StreakWarning";
import { getImplementedExercises } from "@/utils/exerciseStatus";
import { useCountUp } from "@/hooks/useCountUp";
import { Skeleton } from "@/components/ui/skeleton";

const USER_ID = "default";
const LEVEL_SIZE = 500;
const SUBSCORE_LABELS: Record<CommunicationSubscore, string> = {
  fluency: "Fluency",
  clarity: "Clarity",
  precision: "Precision",
  confidence: "Confidence",
  impact: "Impact",
};

const SUBSCORE_EXERCISE: Record<CommunicationSubscore, string> = {
  fluency: "filler-words",
  clarity: "impromptu-response",
  precision: "filler-words",
  confidence: "impromptu-response",
  impact: "impromptu-response",
};

function dateDiffInDays(a: string, b: string): number {
  const aDate = new Date(`${a}T00:00:00Z`);
  const bDate = new Date(`${b}T00:00:00Z`);
  return Math.round((bDate.getTime() - aDate.getTime()) / (24 * 60 * 60 * 1000));
}

function syncStreakOnVisit(progress: UserProgress): UserProgress {
  if (!progress.lastPracticeDate || progress.currentStreak === 0) return progress;
  const today = new Date().toISOString().slice(0, 10);
  const diff = dateDiffInDays(progress.lastPracticeDate, today);
  if (diff <= 1) return progress;
  return { ...progress, currentStreak: 0 };
}

function scoreColor(value: number | null): string {
  if (value === null) return "bg-muted/40";
  if (value >= 80) return "bg-emerald-500/80";
  if (value >= 60) return "bg-emerald-400/75";
  return "bg-red-500/80";
}

function routeForExercise(exerciseId: string): string {
  return `/exercises/${exerciseId}`;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const streak = useStreak();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [attempts, setAttempts] = useState<ExerciseAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animatedOverall, setAnimatedOverall] = useState(0);
  const [animatedSubscores, setAnimatedSubscores] = useState<Record<string, number>>({});

  useEffect(() => {
    const rawProgress = getUserProgress(USER_ID);
    const synced = syncStreakOnVisit(rawProgress);
    if (synced.currentStreak !== rawProgress.currentStreak) {
      saveUserProgress(USER_ID, synced);
    }
    setProgress(synced);
    setAttempts(getExerciseHistory(USER_ID).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    setIsLoading(false);
  }, []);

  const score = progress?.communicationScore;
  const overall = score?.overall ?? 0;
  const stars = Math.max(1, Math.min(5, Math.round(overall / 20)));
  const level = Math.floor((progress?.totalXP ?? 0) / LEVEL_SIZE) + 1;
  const pointsToNextLevel = LEVEL_SIZE - ((progress?.totalXP ?? 0) % LEVEL_SIZE);

  const measuredSubscores = useMemo(
    () =>
      (Object.keys(SUBSCORE_LABELS) as CommunicationSubscore[]).map((key) => ({
        key,
        label: SUBSCORE_LABELS[key],
        value: score?.[key] ?? null,
      })),
    [score]
  );

  const priority = useMemo(() => {
    const measured = measuredSubscores.filter(
      (s): s is { key: CommunicationSubscore; label: string; value: number } =>
        typeof s.value === "number"
    );
    const lowest = measured.length
      ? measured.sort((a, b) => a.value - b.value)[0]
      : { key: "fluency" as CommunicationSubscore, label: "Fluency", value: 0 };
    const exerciseId = SUBSCORE_EXERCISE[lowest.key];
    const exercise = getExerciseById(exerciseId);
    return {
      subscore: lowest,
      exerciseId,
      exerciseName: exercise?.name ?? "Filler Word Cleanup",
      target: Math.min(95, Math.max(75, lowest.value + 20)),
      sessions: `${4 + Math.floor(Math.max(0, 70 - lowest.value) / 10)}-${6 + Math.floor(
        Math.max(0, 70 - lowest.value) / 10
      )}`,
    };
  }, [measuredSubscores]);

  const alternativeExercises = useMemo(() => {
    return getImplementedExercises().filter((exercise) => exercise.id !== priority.exerciseId).slice(0, 3);
  }, [priority.exerciseId]);

  const weekly = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    const inRange = attempts.filter((a) => a.timestamp >= sevenDaysAgo);
    const uniqueDays = new Set(inRange.map((a) => a.timestamp.toISOString().slice(0, 10))).size;
    const xp = inRange.reduce((sum, a) => sum + a.xpEarned, 0);
    return { uniqueDays, xp };
  }, [attempts]);

  const recent = useMemo(() => attempts.slice(0, 3), [attempts]);

  const badges = useMemo(() => {
    const items: string[] = [];
    if ((progress?.currentStreak ?? 0) >= 3) items.push("Streak Builder");
    if ((progress?.totalXP ?? 0) >= 250) items.push("XP Starter");
    if ((progress?.totalSessions ?? 0) >= 5) items.push("Consistency");
    return items.slice(0, 3);
  }, [progress]);

  const streakPrefix =
    streak.currentStreak >= 100
      ? "🔥🎉"
      : streak.currentStreak >= 30
      ? "🔥🎉"
      : streak.currentStreak >= 7
      ? "🔥🎉"
      : "🔥";

  const overallCount = useCountUp(overall, { durationMs: 800 });
  const pointsCount = useCountUp(Math.max(0, (progress?.totalXP ?? 0) % LEVEL_SIZE), {
    durationMs: 800,
    delayMs: 120,
  });

  useEffect(() => {
    setAnimatedOverall(0);
    const frame = window.requestAnimationFrame(() => setAnimatedOverall(overall));
    return () => window.cancelAnimationFrame(frame);
  }, [overall]);

  useEffect(() => {
    const keys = measuredSubscores.map((item) => item.key);
    setAnimatedSubscores(
      keys.reduce((acc, key) => {
        acc[key] = 0;
        return acc;
      }, {} as Record<string, number>)
    );
    const timers = measuredSubscores.map((item, index) =>
      window.setTimeout(() => {
        setAnimatedSubscores((prev) => ({ ...prev, [item.key]: item.value ?? 12 }));
      }, index * 100)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [measuredSubscores]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-layered px-6 py-8 pb-28 relative page-transition">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 relative z-10">
          <GlassCard className="p-7 space-y-4" hover={false}>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-12 w-28" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-4 w-48" />
          </GlassCard>
          <GlassCard className="p-6 space-y-3" hover={false}>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </GlassCard>
          <GlassCard className="p-6 space-y-3" hover={false}>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-8 pb-28 relative page-transition">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <FuturismBlock
          variant="block-1"
          className="top-8 right-[-140px] opacity-40"
          borderColor="#4CC9F0"
          blendMode="normal"
          zIndex={1}
        />
        <FuturismBlock
          variant="block-3"
          className="top-28 left-[-150px] opacity-35"
          borderColor="#F72585"
          blendMode="normal"
          zIndex={2}
        />
        <FuturismBlock
          variant="triangle-2"
          className="top-[54%] right-[-170px] opacity-32"
          borderColor="#4ADE80"
          blendMode="normal"
          zIndex={1}
        />
        <FuturismBlock
          variant="stripe-1"
          className="bottom-24 left-[-190px] opacity-38"
          blendMode="normal"
          zIndex={1}
        />
      </div>

      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 relative z-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-full glass-subtle flex items-center justify-center text-sm font-semibold text-foreground hover:scale-[1.03] transition-transform"
              aria-label="Open profile settings"
              title="Profile settings"
            >
              A
            </button>
            <div>
              <p className="text-sm text-muted-foreground font-sans">Welcome back</p>
              <p className="font-serif text-foreground">Alex</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="btn-glass h-10 px-3 text-sm font-sans inline-flex items-center">
              <span
                className={`font-semibold ${
                  streak.isAtRisk ? "text-primary animate-pulse" : ""
                }`}
              >
                <span className="flame-pulse inline-block mr-1">{streakPrefix}</span>
                <strong>{streak.currentStreak}</strong> days
              </span>
            </div>
            <button
              onClick={() => navigate("/exercises")}
              className="btn-glass h-10 px-3 text-sm font-sans"
            >
              Browse Library
            </button>
            <QuickPracticeModal progress={progress} />
          </div>
        </div>

        <StreakWarning />

        {/* Hero */}
        <GlassCard className="p-7 space-y-5" hover={false}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-sans">
                Communication Power
              </p>
              <p className="text-5xl font-serif font-bold text-foreground">
                {Math.round(overallCount)}
                <span className="text-xl text-muted-foreground font-sans">/100</span>
              </p>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={i < stars ? "text-primary" : "text-muted-foreground/40"}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground font-sans">Archetype</p>
              <p className="text-lg font-serif text-foreground">
                {progress?.archetype?.name ?? "Emerging Speaker"}
              </p>
            </div>
          </div>
          <div className="h-3 w-full rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${animatedOverall}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground font-sans">
            <Sparkles className="inline-block w-4 h-4 mr-1 -mt-0.5" />
            {pointsToNextLevel} points to Level {level + 1} • {Math.round(pointsCount)}/{LEVEL_SIZE} XP
          </p>
        </GlassCard>

        {/* Subscores */}
        <GlassCard className="p-6 space-y-4" hover={false}>
          <h2 className="font-serif text-xl text-foreground">Subscores</h2>
          {measuredSubscores.map((item) => (
            <div key={item.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm font-sans">
                <span className={item.value === null ? "text-muted-foreground" : "text-foreground"}>
                  {item.label}
                </span>
                <span className="text-muted-foreground">
                  {item.value === null ? "Unknown" : `${item.value}/100`}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
                <div
                  className={`h-full rounded-full ${scoreColor(item.value)} transition-all duration-1000 ease-out`}
                  style={{ width: `${animatedSubscores[item.key] ?? 0}%` }}
                />
              </div>
            </div>
          ))}
        </GlassCard>

        {/* Priority card */}
        <GlassCard className="p-7 space-y-5 border-2 border-primary/30 shadow-2xl" hover={false}>
          <div className="section-accent">
            <p className="text-sm uppercase tracking-[0.2em] text-primary font-sans">
              Priority: {priority.subscore.label}
            </p>
          </div>
          <h2 className="text-3xl font-serif font-bold text-foreground">{priority.exerciseName}</h2>
          <div className="meta-row">
            <span className="meta-chip">Current {priority.subscore.value}/100</span>
            <span className="meta-chip">Target {priority.target}/100</span>
            <span className="meta-chip">Est. sessions {priority.sessions}</span>
          </div>
          <Button
            className="btn-warm w-full text-lg"
            onClick={() => navigate(routeForExercise(priority.exerciseId))}
          >
            START
          </Button>
        </GlassCard>

        {/* Alternative exercises */}
        <GlassCard className="p-6 space-y-3" hover={false}>
          <h3 className="font-serif text-lg text-foreground">Also good for you:</h3>
          <div className="grid gap-2">
            {alternativeExercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => navigate(routeForExercise(exercise.id))}
                className="flex items-center justify-between rounded-xl px-2 py-2 text-left"
              >
                <div>
                  <p className="font-sans text-foreground">{exercise.name}</p>
                  <p className="text-xs text-muted-foreground font-sans">{exercise.shortDescription}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Weekly progress */}
        <GlassCard className="p-6 space-y-4" hover={false}>
          <h3 className="font-serif text-lg text-foreground">This Week</h3>
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-24 h-24 rounded-full border-8 border-primary/25 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xl font-serif font-bold text-foreground">{weekly.uniqueDays}/7</p>
                <p className="text-[10px] text-muted-foreground font-sans">days</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-sans text-foreground">XP this week: {weekly.xp}</p>
              <div className="meta-row">
                {(badges.length ? badges : ["No badges yet"]).map((badge) => (
                  <span key={badge} className="meta-chip">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Recent activity */}
        <GlassCard className="p-6 space-y-3" hover={false}>
          <h3 className="font-serif text-lg text-foreground">Recent Activity</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans">
              Start your first session to see momentum stats.
            </p>
          ) : (
            recent.map((attempt, idx) => {
              const previous = attempts
                .filter(
                  (a) =>
                    a.exerciseId === attempt.exerciseId &&
                    a.timestamp.getTime() < attempt.timestamp.getTime()
                )
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
              const improvementPct = previous
                ? Math.round(((attempt.score - previous.score) / Math.max(previous.score, 1)) * 100)
                : null;

              return (
                <div key={attempt.id} className="space-y-3">
                  <button
                    className="w-full text-left rounded-xl px-1 py-1"
                    onClick={() => navigate(routeForExercise(attempt.exerciseId))}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-sans text-foreground">
                        {getExerciseById(attempt.exerciseId)?.name ?? attempt.exerciseId}
                      </p>
                      <p className="text-xs text-muted-foreground font-sans">
                        +{attempt.xpEarned} XP
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground font-sans mt-1">
                      {previous
                        ? `${previous.score} → ${attempt.score} ${
                            improvementPct !== null
                              ? improvementPct >= 0
                                ? `⬆ ${improvementPct}%`
                                : `⬇ ${Math.abs(improvementPct)}%`
                              : ""
                          }`
                        : `Score ${attempt.score}`}
                    </p>
                    <p className="text-xs text-muted-foreground/80 font-sans mt-1">
                      Improved: {Object.keys(attempt.impactedScores).join(", ")}
                    </p>
                  </button>
                  {idx < recent.length - 1 && <div className="section-divider" />}
                </div>
              );
            })
          )}
        </GlassCard>

        <button
          className="self-start text-sm font-sans text-primary hover:underline inline-flex items-center gap-1"
          onClick={() => navigate("/progress")}
        >
          View All Progress <ChevronRight className="w-4 h-4" />
        </button>

        <div className="h-8" />
      </div>
    </div>
  );
};

export default DashboardPage;
