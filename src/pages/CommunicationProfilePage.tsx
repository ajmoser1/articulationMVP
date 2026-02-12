import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Download, Lock, Share2, Star, TriangleAlert } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { FuturismBlock } from "@/components/ui/FuturismBlock";
import { ACHIEVEMENTS } from "@/data/achievements";
import { determineArchetype } from "@/data/archetypes";
import { getExerciseHistory, getUserProgress } from "@/utils/storage";
import type { CommunicationScore, ExerciseAttempt, UserProgress } from "@/types/exercise";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { getAchievementProgress } from "@/utils/achievements";
import { useCountUp } from "@/hooks/useCountUp";
import { Skeleton } from "@/components/ui/skeleton";

const USER_ID = "default";

const ARCHETYPE_EMOJI: Record<string, string> = {
  "rapid-thinker": "⚡",
  wanderer: "🧭",
  hedger: "🪞",
  "generic-speaker": "🧩",
  "polished-pro": "✨",
};

const SCORE_LABELS: { key: keyof CommunicationScore; label: string }[] = [
  { key: "fluency", label: "Fluency" },
  { key: "clarity", label: "Clarity" },
  { key: "precision", label: "Precision" },
  { key: "confidence", label: "Confidence" },
  { key: "impact", label: "Impact" },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getPercentile = (score: number) => clamp(Math.round(score * 0.7 + 25), 10, 99);

const getStarCount = (score: number) => clamp(Math.round(score / 20), 1, 5);

const getBarColor = (value: number | null) => {
  if (value === null) return "bg-muted/40";
  if (value >= 80) return "bg-emerald-500/80";
  if (value >= 60) return "bg-emerald-400/75";
  return "bg-red-500/80";
};

const CommunicationProfilePage = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [attempts, setAttempts] = useState<ExerciseAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animatedOverall, setAnimatedOverall] = useState(0);
  const [animatedSubscores, setAnimatedSubscores] = useState<Record<string, number>>({});

  useEffect(() => {
    setProgress(getUserProgress(USER_ID));
    setAttempts(getExerciseHistory(USER_ID));
    setIsLoading(false);
  }, []);

  const heroReveal = useScrollReveal({ threshold: 0.2 });
  const scoreReveal = useScrollReveal({ threshold: 0.2 });
  const subscoresReveal = useScrollReveal({ threshold: 0.25 });
  const insightsReveal = useScrollReveal({ threshold: 0.3 });
  const pathReveal = useScrollReveal({ threshold: 0.35 });
  const achievementsReveal = useScrollReveal({ threshold: 0.2 });

  const score = progress?.communicationScore;
  const overallScore = score ? clamp(score.overall, 0, 100) : 0;
  const overallCount = useCountUp(overallScore, { durationMs: 800 });
  const percentile = getPercentile(overallScore);
  const starCount = getStarCount(overallScore);

  const archetype = useMemo(() => {
    if (!score) return null;
    return determineArchetype(score);
  }, [score]);

  const archetypeEmoji = ARCHETYPE_EMOJI[archetype?.id ?? "generic-speaker"];
  const earnedAchievementIds = new Set(
    (progress?.achievements ?? []).filter((id) => ACHIEVEMENTS.some((achievement) => achievement.id === id))
  );
  const totalAchievements = ACHIEVEMENTS.length;
  const earnedCount = earnedAchievementIds.size;
  const achievementsSorted = useMemo(
    () =>
      [...ACHIEVEMENTS].sort((a, b) => {
        if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
        return a.name.localeCompare(b.name);
      }),
    []
  );

  const scoreValues = useMemo(() => {
    return SCORE_LABELS.map(({ key, label }) => {
      const value = score?.[key] ?? null;
      return { key, label, value };
    });
  }, [score]);

  useEffect(() => {
    setAnimatedOverall(0);
    const frame = window.requestAnimationFrame(() => setAnimatedOverall(overallScore));
    return () => window.cancelAnimationFrame(frame);
  }, [overallScore]);

  useEffect(() => {
    const keys = scoreValues.map((item) => String(item.key));
    setAnimatedSubscores(
      keys.reduce((acc, key) => {
        acc[key] = 0;
        return acc;
      }, {} as Record<string, number>)
    );
    const timers = scoreValues.map((item, index) =>
      window.setTimeout(() => {
        setAnimatedSubscores((prev) => ({ ...prev, [String(item.key)]: item.value ?? 12 }));
      }, index * 100)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [scoreValues]);

  const { strongest, weakest } = useMemo(() => {
    const numeric = scoreValues.filter((item) => typeof item.value === "number") as Array<{
      key: keyof CommunicationScore;
      label: string;
      value: number;
    }>;
    if (numeric.length === 0) return { strongest: null, weakest: null };
    const strongest = [...numeric].sort((a, b) => b.value - a.value)[0];
    const weakest = [...numeric].sort((a, b) => a.value - b.value)[0];
    return { strongest, weakest };
  }, [scoreValues]);

  const handleStartJourney = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("profile_seen", "true");
    }
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-layered px-6 py-10 pb-32 flex flex-col relative page-transition">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-8 relative z-10">
          <GlassCard className="p-8 space-y-4" hover={false}>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-12 w-72" />
            <Skeleton className="h-5 w-full" />
          </GlassCard>
          <GlassCard className="p-8 space-y-3" hover={false}>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-12 w-28" />
            <Skeleton className="h-3 w-full rounded-full" />
          </GlassCard>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-10 pb-32 flex flex-col relative page-transition">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <FuturismBlock
          variant="block-1"
          className="top-8 right-[-140px] opacity-45"
          borderColor="#4CC9F0"
          blendMode="normal"
          zIndex={1}
        />
        <FuturismBlock
          variant="block-3"
          className="top-24 left-[-140px] opacity-40"
          borderColor="#F72585"
          blendMode="normal"
          zIndex={2}
        />
        <FuturismBlock
          variant="triangle-2"
          className="top-1/2 left-[-180px] opacity-35"
          borderColor="#4ADE80"
          blendMode="normal"
          zIndex={1}
        />
        <FuturismBlock
          variant="block-4"
          className="top-[58%] right-[-160px] opacity-40"
          borderColor="#7209B7"
          blendMode="normal"
          zIndex={2}
        />
        <FuturismBlock
          variant="stripe-1"
          className="top-40 right-[-200px] opacity-55"
          blendMode="normal"
          zIndex={1}
        />
        <FuturismBlock
          variant="stripe-3"
          className="bottom-20 left-[-200px] opacity-50"
          blendMode="normal"
          zIndex={1}
        />
      </div>
      <div className="profile-content-backdrop" />

      <div className="max-w-2xl mx-auto w-full flex flex-col gap-8 relative z-10">
        <section
          ref={heroReveal.ref}
          className="section-reveal is-visible"
        >
          <div className="rounded-[28px] overflow-hidden bg-gradient-to-br from-primary/10 via-background to-transparent border border-white/30">
            <div className="p-8 sm:p-10">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-sans">
                Your communication archetype
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <div className="text-5xl">{archetypeEmoji}</div>
                <h1 className="text-4xl sm:text-5xl font-serif font-bold text-foreground">
                  {archetype ? `${archetypeEmoji} ${archetype.name}` : "Your Profile"}
                </h1>
                <p className="text-muted-foreground font-serif text-lg">
                  {archetype?.description ??
                    "We’re calibrating your communication style. Complete more sessions to unlock a detailed profile."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={scoreReveal.ref}
          className="section-reveal is-visible"
        >
          <GlassCard className="p-8 space-y-6" hover={false}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground font-sans">
                  Overall score
                </p>
                <p className="text-5xl font-serif font-bold text-foreground">
                  {Math.round(overallCount)}
                  <span className="text-xl text-muted-foreground font-sans">/100</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < starCount ? "text-primary fill-primary" : "text-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="h-3 w-full rounded-full bg-muted/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-1000 ease-out"
                style={{ width: `${animatedOverall}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground font-sans">
              You speak better than <span className="text-foreground font-semibold">{percentile}%</span>{" "}
              of people in our community.
            </p>
          </GlassCard>
        </section>

        <section
          ref={subscoresReveal.ref}
          className="section-reveal is-visible"
        >
          <GlassCard className="p-8 space-y-6" hover={false}>
            <h2 className="text-2xl font-serif font-semibold text-foreground">
              Subscore breakdown
            </h2>
            <div className="space-y-4">
              {scoreValues.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-sans">
                    <span className="text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">
                      {item.value === null ? "Not enough data" : `${item.value}/100`}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getBarColor(item.value)}`}
                      style={{ width: `${animatedSubscores[String(item.key)] ?? 0}%`, transition: "width 1000ms ease-out" }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
                    {item.value !== null && item.value >= 80 && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Strength
                      </>
                    )}
                    {item.value !== null && item.value < 60 && (
                      <>
                        <TriangleAlert className="h-4 w-4 text-red-500" />
                        Needs focus
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        <section
          ref={insightsReveal.ref}
          className="section-reveal is-visible"
        >
          <div className="grid gap-4">
            <GlassCard className="p-6 border border-red-500/20 bg-red-500/10" hover={false}>
              <p className="text-xs uppercase tracking-wide text-red-700 font-sans">
                Critical issue
              </p>
              <p className="text-foreground font-serif text-lg">
                {weakest
                  ? `${weakest.label} is your biggest drag (${weakest.value}/100).`
                  : "We need one more session to identify your biggest blocker."}
              </p>
            </GlassCard>
            <GlassCard className="p-6 border border-emerald-500/20 bg-emerald-500/10" hover={false}>
              <p className="text-xs uppercase tracking-wide text-emerald-700 font-sans">
                Your strength
              </p>
              <p className="text-foreground font-serif text-lg">
                {strongest
                  ? `${strongest.label} is your standout strength (${strongest.value}/100).`
                  : "We’ll highlight your strengths as more data comes in."}
              </p>
            </GlassCard>
            <GlassCard className="p-6 border border-sky-500/20 bg-sky-500/10" hover={false}>
              <p className="text-xs uppercase tracking-wide text-sky-700 font-sans">Quick win</p>
              <p className="text-foreground font-serif text-lg">
                {weakest
                  ? `Target ${weakest.label.toLowerCase()} with short, focused reps to unlock fast gains.`
                  : "Try one more practice to unlock a personalized quick win."}
              </p>
            </GlassCard>
          </div>
        </section>

        <section
          ref={pathReveal.ref}
          className="section-reveal is-visible"
        >
          <GlassCard className="p-8 space-y-6" hover={false}>
            <h2 className="text-2xl font-serif font-semibold text-foreground">
              Recommended path
            </h2>
            <ol className="space-y-4 text-foreground font-sans">
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
                  1
                </span>
                Master filler control (4–6 sessions)
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
                  2
                </span>
                Build structure with one‑minute explainers (3–5 sessions)
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
                  3
                </span>
                Push precision and impact with focused challenges
              </li>
            </ol>
          </GlassCard>
        </section>

        <section
          ref={achievementsReveal.ref}
          className="section-reveal is-visible"
        >
          <GlassCard className="p-8 space-y-6" hover={false}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-serif font-semibold text-foreground">Achievements</h2>
              <p className="text-sm font-sans text-muted-foreground">
                {earnedCount}/{totalAchievements} earned
              </p>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 place-items-center">
              {achievementsSorted.map((achievement) => {
                const unlocked = earnedAchievementIds.has(achievement.id);
                const progressMeter =
                  progress ? getAchievementProgress(achievement, progress, attempts) : null;

                return (
                  <button
                    type="button"
                    key={achievement.id}
                    className="group relative"
                    aria-label={`${achievement.name} achievement`}
                  >
                    <div
                      className={`h-14 w-14 rounded-full border flex items-center justify-center text-2xl transition-all ${
                        unlocked
                          ? "bg-primary/15 border-primary/35 shadow-[0_0_0_4px_rgba(74,103,65,0.08)]"
                          : "bg-muted/25 border-white/25 grayscale-[0.5] opacity-80"
                      }`}
                    >
                      <span aria-hidden="true">{achievement.icon}</span>
                    </div>
                    {!unlocked && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-background/90 border border-white/25 flex items-center justify-center">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </span>
                    )}

                    <div
                      className={`pointer-events-none absolute left-1/2 top-[calc(100%+10px)] -translate-x-1/2 w-52 rounded-xl border p-3 text-left shadow-xl opacity-0 translate-y-1 transition-all duration-150 z-30
                      group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 ${
                      unlocked
                        ? "bg-card border-primary/30"
                        : "bg-card border-white/20"
                    }`}
                    >
                      <p className="text-sm font-semibold text-foreground leading-tight">{achievement.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{achievement.requirement}</p>
                      <p className="text-[11px] text-primary mt-1">+{achievement.xpReward} XP</p>
                      {progressMeter && !unlocked && (
                        <div className="mt-2 space-y-1">
                          <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary/75"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round((progressMeter.current / progressMeter.target) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {Math.min(progressMeter.current, progressMeter.target)}/{progressMeter.target}
                          </p>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </section>

        <div className="space-y-4">
          <Button className="btn-warm w-full text-lg" onClick={handleStartJourney}>
            Start Your Journey
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" className="btn-glass flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="secondary" className="btn-glass flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationProfilePage;
