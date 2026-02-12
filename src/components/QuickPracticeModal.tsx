import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EXERCISES } from "@/data/exercises";
import type { CommunicationSubscore, ExerciseConfig, UserProgress } from "@/types/exercise";

const SUBSCORE_PRIORITY: CommunicationSubscore[] = [
  "fluency",
  "clarity",
  "precision",
  "confidence",
  "impact",
];

const SUBSCORE_EXERCISES: Record<CommunicationSubscore, string[]> = {
  fluency: ["filler-words"],
  clarity: ["one-minute-explainer", "eliminate-meandering"],
  precision: ["eliminate-meandering", "precision-ladder"],
  confidence: ["assertive-reframing", "closing-statement"],
  impact: ["closing-statement", "structured-persuasion"],
};

function routeForExercise(exercise: ExerciseConfig): string {
  if (exercise.id === "filler-words") return "/onboarding/topics";
  if (exercise.type === "verbal" || exercise.type === "both") return "/onboarding/topics";
  return "/exercises";
}

function formatMinutes(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins} min`;
}

function pickQuickPlan(
  progress: UserProgress | null,
  targetMinutes: number,
  includeSpeaking: boolean
): ExerciseConfig[] {
  const targetSeconds = targetMinutes * 60;
  const candidates = EXERCISES.filter((exercise) => {
    if (includeSpeaking) return true;
    return exercise.type === "written";
  });

  if (!candidates.length) return [];

  const weaknessOrder = [...SUBSCORE_PRIORITY].sort((a, b) => {
    const aScore = progress?.communicationScore[a] ?? 50;
    const bScore = progress?.communicationScore[b] ?? 50;
    return aScore - bScore;
  });

  const prioritizedIds = weaknessOrder.flatMap((subscore) => SUBSCORE_EXERCISES[subscore]);
  const byPriority = candidates.sort((a, b) => {
    const aIdx = prioritizedIds.indexOf(a.id);
    const bIdx = prioritizedIds.indexOf(b.id);
    const aRank = aIdx === -1 ? 999 : aIdx;
    const bRank = bIdx === -1 ? 999 : bIdx;
    if (aRank !== bRank) return aRank - bRank;
    return a.estimatedTime - b.estimatedTime;
  });

  const selected: ExerciseConfig[] = [];
  let total = 0;
  for (const exercise of byPriority) {
    if (selected.length >= 3) break;
    const canAddWithinBudget = total + exercise.estimatedTime <= targetSeconds + 45;
    if (canAddWithinBudget || selected.length === 0) {
      selected.push(exercise);
      total += exercise.estimatedTime;
    }
  }

  if (selected.length === 0) {
    selected.push(byPriority[0]);
  }
  return selected;
}

interface QuickPracticeModalProps {
  progress: UserProgress | null;
}

export const QuickPracticeModal = ({ progress }: QuickPracticeModalProps) => {
  const navigate = useNavigate();
  const [minutes, setMinutes] = useState(5);
  const [includeSpeaking, setIncludeSpeaking] = useState(true);

  const plan = useMemo(
    () => pickQuickPlan(progress, minutes, includeSpeaking),
    [progress, minutes, includeSpeaking]
  );

  const handleStart = () => {
    if (plan.length === 0) return;
    const first = plan[0];
    localStorage.setItem("quick_practice_minutes", String(minutes));
    localStorage.setItem(
      "quick_practice_mode",
      includeSpeaking ? "speaking" : "non-verbal"
    );
    localStorage.setItem(
      "quick_practice_plan",
      JSON.stringify(plan.map((p) => p.id))
    );
    localStorage.setItem("selected_exercise_id", first.id);
    navigate(routeForExercise(first));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="btn-glass h-10 px-3">
          <Zap className="w-4 h-4 mr-1" />
          Quick Practice
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-subtle border-white/30 shadow-2xl">
        <DialogHeader>
          <DialogTitle>Quick Practice</DialogTitle>
          <DialogDescription>
            Build a focused session for the time you have right now.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-sans mb-2">
              Time
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[2, 5, 10, 15].map((m) => (
                <button
                  key={m}
                  onClick={() => setMinutes(m)}
                  className={`h-11 rounded-xl text-sm font-sans ${
                    minutes === m
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "glass-subtle text-muted-foreground"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-sans mb-2">
              Mode
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIncludeSpeaking(true)}
                className={`h-11 rounded-xl text-sm font-sans ${
                  includeSpeaking
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "glass-subtle text-muted-foreground"
                }`}
              >
                ✓ Include speaking
              </button>
              <button
                onClick={() => setIncludeSpeaking(false)}
                className={`h-11 rounded-xl text-sm font-sans ${
                  !includeSpeaking
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "glass-subtle text-muted-foreground"
                }`}
              >
                ○ Non-verbal only
              </button>
            </div>
          </div>

          <div className="rounded-xl glass-subtle p-3">
            <p className="text-sm font-sans text-foreground mb-1">
              Recommended for {minutes} min:
            </p>
            <ul className="space-y-1">
              {plan.map((exercise) => (
                <li key={exercise.id} className="text-sm text-muted-foreground font-sans">
                  • {exercise.name} ({formatMinutes(exercise.estimatedTime)})
                </li>
              ))}
            </ul>
          </div>

          <Button className="btn-warm w-full text-base" onClick={handleStart}>
            Start Quick Session
          </Button>
          <button
            className="w-full text-sm text-primary font-sans hover:underline"
            onClick={() =>
              navigate(
                `/exercises?quickTime=${minutes}&quickMode=${
                  includeSpeaking ? "speaking" : "non-verbal"
                }`
              )
            }
          >
            Let me choose exercises →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
