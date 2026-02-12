import type { AchievementDefinition } from "@/data/achievements";

interface AchievementToastProps {
  achievement: AchievementDefinition;
}

export function AchievementToast({ achievement }: AchievementToastProps) {
  return (
    <div className="achievement-toast-enter flex items-center gap-3">
      <div className="h-11 w-11 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-xl">
        <span role="img" aria-label={achievement.name}>
          {achievement.icon}
        </span>
      </div>
      <div className="flex flex-col">
        <p className="text-xs uppercase tracking-wide text-primary font-sans">Achievement Unlocked!</p>
        <p className="text-sm font-semibold text-foreground">{achievement.name}</p>
        <p className="text-xs text-muted-foreground">+{achievement.xpReward} XP bonus</p>
      </div>
    </div>
  );
}
