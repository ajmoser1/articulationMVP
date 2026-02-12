import { useNavigate } from "react-router-dom";
import { Flame, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStreak } from "@/hooks/useStreak";

export const StreakWarning = () => {
  const navigate = useNavigate();
  const { currentStreak, isAtRisk } = useStreak();

  if (!isAtRisk || currentStreak <= 0) return null;

  return (
    <div className="rounded-2xl border border-primary/35 bg-primary/12 px-4 py-3 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm font-sans text-foreground inline-flex items-center gap-2">
          <Flame className="w-4 h-4 text-primary" />
          Don&apos;t lose your <strong>{currentStreak}-day streak</strong>! Practice before
          midnight.
        </p>
        <Button
          className="btn-warm h-9 px-3 text-sm"
          onClick={() => navigate("/onboarding/topics")}
        >
          <Zap className="w-4 h-4 mr-1" />
          Quick Practice
        </Button>
      </div>
    </div>
  );
};
