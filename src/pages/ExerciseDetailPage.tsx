import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock3, Flame, PlayCircle, Star, TrendingUp, Users } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { FuturismBlock } from "@/components/ui/FuturismBlock";
import { Button } from "@/components/ui/button";
import { EXERCISES, getExerciseById } from "@/data/exercises";
import { getExerciseHistory } from "@/utils/storage";
import type { ExerciseConfig } from "@/types/exercise";
import { isExerciseImplemented } from "@/utils/exerciseStatus";
import { ExercisePlaceholder } from "@/components/exercises/ExercisePlaceholder";

const USER_ID = "default";

const ICON_EMOJI: Record<string, string> = {
  "message-circle": "🗣️",
  target: "🎯",
  layers: "🧩",
  scissors: "✂️",
  "layout-list": "🗂️",
  mic: "🎤",
  filter: "🧪",
  "git-compare": "🔍",
  palette: "🎨",
  expand: "📦",
  "scan-search": "🛰️",
  "book-open": "📘",
  triangle: "🔺",
  heart: "❤️",
};

const CATEGORY_LABELS: Record<string, string> = {
  fluency: "Fluency",
  clarity: "Clarity",
  precision: "Precision",
  confidence: "Confidence",
  impact: "Impact",
};

const TIER_LABELS: Record<ExerciseConfig["tier"], string> = {
  foundation: "Foundation",
  adaptive: "Adaptive",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function formatShortDate(value: Date): string {
  return value.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatLongDate(value: Date): string {
  return value.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getHowItWorks(exercise: ExerciseConfig): string[] {
  if (exercise.id === "filler-words") {
    return [
      "Pick a prompt and record a 60-second answer.",
      "Speak naturally while aiming for calm, intentional pauses.",
      "Review your filler highlights and repeat with one improvement goal.",
    ];
  }
  if (exercise.id === "one-minute-explainer") {
    return [
      "Choose a simple concept you can explain quickly.",
      "Structure it as opening, core idea, and concise close.",
      "Re-run with tighter transitions and fewer tangents.",
    ];
  }
  return [
    "Read the prompt and prepare your response plan.",
    "Complete the exercise in one focused attempt.",
    "Review your score trend and repeat with one targeted adjustment.",
  ];
}

function getWhyItMatters(exercise: ExerciseConfig): string {
  if (exercise.category === "fluency") return "Fluency builds trust. Fewer filler habits make your ideas sound sharper and more confident.";
  if (exercise.category === "clarity") return "Clarity reduces confusion and keeps people engaged, especially in high-stakes moments.";
  if (exercise.category === "precision") return "Precision helps your message land quickly with less back-and-forth.";
  if (exercise.category === "confidence") return "Confidence changes how your message is received, even before people process your words.";
  return "Impact makes your communication memorable, actionable, and persuasive.";
}

function getWhoItsFor(exercise: ExerciseConfig): string {
  if (exercise.type === "written") return "Great for anyone who wants to improve structure and wording before live speaking.";
  if (exercise.tier === "advanced") return "Best for users already consistent with fundamentals who want high-performance reps.";
  if (exercise.tier === "intermediate" || exercise.tier === "adaptive") return "Ideal if you have baseline consistency and want to level up delivery quality.";
  return "Perfect for beginners and returning users building strong communication habits.";
}

function getExpectedTimeline(exercise: ExerciseConfig): string {
  const primary = exercise.impactsScores[0] ?? "your primary communication skill";
  return `After 5 sessions, expect visible gains in ${primary}. After 10+ sessions, these improvements usually become more automatic in real conversations.`;
}

function getRelatedExercises(exercise: ExerciseConfig): ExerciseConfig[] {
  const byCategory = EXERCISES.filter((candidate) => candidate.id !== exercise.id && candidate.category === exercise.category);
  const byOverlap = EXERCISES.filter(
    (candidate) =>
      candidate.id !== exercise.id &&
      candidate.impactsScores.some((score) => exercise.impactsScores.includes(score))
  );
  const merged = [...byCategory, ...byOverlap];
  const unique = merged.filter((candidate, index) => merged.findIndex((x) => x.id === candidate.id) === index);
  return unique.slice(0, 3);
}

const ExerciseDetailPage = () => {
  const navigate = useNavigate();
  const { exerciseId = "" } = useParams();
  const exercise = getExerciseById(exerciseId);

  const attempts = useMemo(
    () =>
      getExerciseHistory(USER_ID)
        .filter((attempt) => attempt.exerciseId === exerciseId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [exerciseId]
  );

  if (!exercise) {
    return (
      <div className="min-h-screen bg-gradient-layered px-6 py-8 pb-28 page-transition">
        <div className="max-w-3xl mx-auto">
          <GlassCard className="p-8 space-y-4" hover={false}>
            <p className="text-2xl font-serif text-foreground">Exercise not found</p>
            <p className="text-sm text-muted-foreground font-sans">
              This exercise may have moved or is not available yet.
            </p>
            <Button className="btn-warm" onClick={() => navigate("/exercises")}>
              Back to Exercise Library
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  const bestScore = attempts.length ? Math.max(...attempts.map((attempt) => attempt.score)) : null;
  const currentScore = attempts[0]?.score ?? null;
  const lastAttempt = attempts[0]?.timestamp ?? null;

  const scoreHistory = attempts
    .slice()
    .reverse()
    .map((attempt, index) => ({
      index: index + 1,
      score: attempt.score,
      date: formatShortDate(attempt.timestamp),
    }));

  const averageDelta =
    attempts.length >= 2
      ? Math.round((attempts[0].score - attempts[attempts.length - 1].score) * 10) / 10
      : null;

  const implemented = isExerciseImplemented(exercise.id);
  const startLabel = implemented
    ? attempts.length > 0
      ? "Practice Again"
      : "Start Exercise"
    : "Coming Soon";
  const stepList = getHowItWorks(exercise);
  const related = getRelatedExercises(exercise);
  const impacted = exercise.impactsScores.map((score) => CATEGORY_LABELS[score] ?? score);
  const estimatedMinutes = Math.max(1, Math.round(exercise.estimatedTime / 60));
  const startRoute = `/exercises/${exercise.id}/practice`;

  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-8 pb-28 relative page-transition">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <FuturismBlock
          variant="block-2"
          className="top-8 right-[-145px] opacity-40"
          borderColor="#4CC9F0"
          blendMode="normal"
          zIndex={1}
        />
        <FuturismBlock
          variant="block-3"
          className="top-24 left-[-150px] opacity-34"
          borderColor="#F72585"
          blendMode="normal"
          zIndex={2}
        />
        <FuturismBlock
          variant="triangle-1"
          className="top-[52%] left-[-170px] opacity-30"
          borderColor="#4ADE80"
          blendMode="normal"
          zIndex={1}
        />
        <FuturismBlock
          variant="stripe-1"
          className="bottom-18 right-[-185px] opacity-36"
          blendMode="normal"
          zIndex={1}
        />
      </div>
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 relative z-10">
        <Link to="/exercises" className="inline-flex items-center gap-2 text-sm text-muted-foreground font-sans hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to library
        </Link>

        <GlassCard className="p-7 space-y-5" hover={false}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl glass-subtle flex items-center justify-center text-2xl">
                {ICON_EMOJI[exercise.icon] ?? "🧠"}
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold text-foreground">{exercise.name}</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-sans">
                    {CATEGORY_LABELS[exercise.category] ?? exercise.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-full glass-subtle text-xs font-sans text-muted-foreground">
                    {exercise.type === "written" ? "Nonverbal" : exercise.type === "both" ? "Verbal + Nonverbal" : "Verbal"}
                  </span>
                  <span className="px-2.5 py-1 rounded-full glass-subtle text-xs font-sans text-muted-foreground">
                    {TIER_LABELS[exercise.tier]}
                  </span>
                  <span className="px-2.5 py-1 rounded-full glass-subtle text-xs font-sans text-muted-foreground inline-flex items-center gap-1">
                    <Clock3 className="w-3 h-3" />
                    ~{estimatedMinutes} min
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-foreground/90 font-sans">{exercise.shortDescription}</p>
        </GlassCard>

        <GlassCard className="p-7 space-y-4" hover={false}>
          <h2 className="text-xl font-serif text-foreground">Description</h2>
          <p className="text-sm font-sans text-foreground/90">{exercise.description}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="section-accent">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-sans">What it improves</p>
              <p className="text-sm font-sans text-foreground mt-1">{impacted.join(" + ")}</p>
            </div>
            <div className="section-accent">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Who this is for</p>
              <p className="text-sm font-sans text-foreground mt-1">{getWhoItsFor(exercise)}</p>
            </div>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
            <p className="text-xs uppercase tracking-wide text-primary font-sans">Why this matters</p>
            <p className="text-sm font-sans text-foreground mt-1">{getWhyItMatters(exercise)}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-7 space-y-4" hover={false}>
          <h2 className="text-xl font-serif text-foreground">Your Performance</h2>
          {attempts.length === 0 ? (
            <p className="text-sm font-sans text-muted-foreground">
              No attempts yet. Your stats and trend chart will appear after your first run.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="section-accent">
                  <p className="text-xs text-muted-foreground font-sans">Current score</p>
                  <p className="text-xl font-serif text-foreground">{currentScore}</p>
                </div>
                <div className="section-accent">
                  <p className="text-xs text-muted-foreground font-sans">Best score</p>
                  <p className="text-xl font-serif text-foreground">{bestScore}</p>
                </div>
                <div className="section-accent">
                  <p className="text-xs text-muted-foreground font-sans">Attempts</p>
                  <p className="text-xl font-serif text-foreground">{attempts.length}</p>
                </div>
                <div className="section-accent">
                  <p className="text-xs text-muted-foreground font-sans">Last attempt</p>
                  <p className="text-sm font-sans text-foreground inline-flex items-center gap-1 mt-1">
                    <CalendarDays className="w-3 h-3" />
                    {lastAttempt ? formatLongDate(lastAttempt) : "—"}
                  </p>
                </div>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.55)" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value}/100`, "Score"]}
                      labelFormatter={(label) => `Attempt ${label}`}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid rgba(74, 103, 65, 0.25)",
                        background: "rgba(255,255,255,0.9)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#4A6741"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 1, fill: "#4A6741" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {averageDelta !== null && (
                <p className="text-sm font-sans text-muted-foreground inline-flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {averageDelta >= 0 ? "+" : ""}
                  {averageDelta} points from your first recorded attempt.
                </p>
              )}
            </>
          )}
        </GlassCard>

        <GlassCard className="p-7 space-y-4" hover={false}>
          <h2 className="text-xl font-serif text-foreground">How It Works</h2>
          <ol className="space-y-2">
            {stepList.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center">
                  {index + 1}
                </span>
                <p className="text-sm font-sans text-foreground/90">{step}</p>
              </li>
            ))}
          </ol>
        </GlassCard>

        <GlassCard className="p-7 space-y-4" hover={false}>
          <h2 className="text-xl font-serif text-foreground">Benefits</h2>
          <div className="flex flex-wrap gap-2">
            {impacted.map((label) => (
              <span key={label} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-sans">
                {label}
              </span>
            ))}
          </div>
          <p className="text-sm font-sans text-foreground/90">{getExpectedTimeline(exercise)}</p>
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-700 font-sans">Expected momentum</p>
            <p className="text-sm font-sans text-foreground mt-1">
              With 2-3 sessions per week, most users notice better control and cleaner structure within the first two weeks.
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-7 space-y-3" hover={false}>
          <h2 className="text-xl font-serif text-foreground">Community Tips (Coming Soon)</h2>
          <p className="text-sm font-sans text-muted-foreground">
            We’ll surface practical tips, mini success stories, and strategy notes from people who improved fastest.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="section-accent">
              <p className="text-sm font-sans text-foreground inline-flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Community tip space
              </p>
            </div>
            <div className="section-accent">
              <p className="text-sm font-sans text-foreground inline-flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                Success stories
              </p>
            </div>
          </div>
        </GlassCard>

        {!implemented && <ExercisePlaceholder exercise={exercise} />}

        <Button
          className="btn-warm w-full text-lg h-14"
          disabled={!implemented}
          onClick={() => {
            window.localStorage.setItem("selected_exercise_id", exercise.id);
            navigate(startRoute);
          }}
        >
          <PlayCircle className="w-5 h-5 mr-2" />
          {startLabel}
        </Button>

        {related.length > 0 && (
          <GlassCard className="p-7 space-y-4" hover={false}>
            <h2 className="text-xl font-serif text-foreground inline-flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              Related Exercises
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {related.map((item) => (
                <button
                  key={item.id}
                  className="rounded-xl p-4 text-left border border-white/30 bg-white/20"
                  onClick={() => navigate(`/exercises/${item.id}`)}
                >
                  <p className="text-sm font-semibold text-foreground">
                    {ICON_EMOJI[item.icon] ?? "🧠"} {item.name}
                  </p>
                  <p className="text-xs font-sans text-muted-foreground mt-1">{item.shortDescription}</p>
                </button>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default ExerciseDetailPage;
