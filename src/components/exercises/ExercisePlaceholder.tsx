import { useMemo, useState } from "react";
import { Bell, Clock3, Lock } from "lucide-react";
import type { ExerciseConfig } from "@/types/exercise";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

const NOTIFY_KEY = "exercise_notify_waitlist";

function getWaitlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(NOTIFY_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWaitlist(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NOTIFY_KEY, JSON.stringify(ids));
  } catch {
    // ignore localStorage write errors
  }
}

interface ExercisePlaceholderProps {
  exercise: ExerciseConfig;
}

export function ExercisePlaceholder({ exercise }: ExercisePlaceholderProps) {
  const [isSaved, setIsSaved] = useState(() => getWaitlist().includes(exercise.id));
  const minutes = Math.max(1, Math.round(exercise.estimatedTime / 60));
  const impacts = useMemo(
    () => exercise.impactsScores.map((score) => score[0].toUpperCase() + score.slice(1)).join(" + "),
    [exercise.impactsScores]
  );

  const handleNotify = () => {
    const list = getWaitlist();
    if (!list.includes(exercise.id)) {
      saveWaitlist([...list, exercise.id]);
    }
    setIsSaved(true);
  };

  return (
    <GlassCard className="p-6 space-y-4 border border-primary/20" hover={false}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-primary font-sans">Coming Soon</p>
          <h3 className="text-xl font-serif text-foreground">{exercise.name}</h3>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-muted/30 text-xs text-muted-foreground inline-flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Locked
        </span>
      </div>

      <p className="text-sm font-sans text-foreground/90">{exercise.description}</p>

      <div className="meta-row">
        <div className="meta-chip inline-flex items-center gap-2">
          <Clock3 className="w-4 h-4" />~{minutes} min
        </div>
        <div className="meta-chip">
          Improves: {impacts}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-primary/30 p-4 bg-primary/5">
        <p className="text-xs uppercase tracking-wide text-primary font-sans mb-1">Preview</p>
        <p className="text-sm font-sans text-foreground/85">
          This exercise is planned and will appear here with full interactions, scoring, and history once released.
        </p>
      </div>

      <Button className="btn-glass w-full" onClick={handleNotify} disabled={isSaved}>
        <Bell className="w-4 h-4 mr-2" />
        {isSaved ? "You’ll be notified when it’s ready" : "Notify Me When Ready"}
      </Button>
    </GlassCard>
  );
}
