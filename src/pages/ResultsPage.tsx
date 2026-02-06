import { useMemo } from "react";
import {
  getExerciseHistory,
  getProgressStats,
  type StoredExerciseResult,
} from "@/lib/persistence";

const ProgressPage = () => {
  const history = useMemo<StoredExerciseResult[]>(() => getExerciseHistory(), []);
  const stats = useMemo(() => getProgressStats(), []);

  // Most recent first
  const sorted = useMemo(
    () =>
      [...history].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [history]
  );

  const bestFPM =
    sorted.length > 0
      ? sorted.reduce(
          (min, r) => (r.fillersPerMinute < min ? r.fillersPerMinute : min),
          sorted[0].fillersPerMinute
        )
      : 0;

  const trendMessage =
    stats.improvementTrend === "improving"
      ? "You're improving! Keep practicing."
      : stats.improvementTrend === "declining"
      ? "Keep at it. Consistency is key."
      : "You're maintaining steady performance.";

  return (
    <div
      className="min-h-screen px-6 py-10 pb-24 flex flex-col items-center"
      style={{ backgroundColor: "#FAF9F6" }}
    >
      <div className="w-full max-w-3xl space-y-10">
        <header>
          <h1 className="text-2xl font-serif font-semibold text-stone-800 mb-2">
            Your progress
          </h1>
          <p className="text-sm text-stone-600 font-sans">
            Track how your filler word usage changes over time.
          </p>
        </header>

        {/* Summary stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-xl border border-stone-200 bg-white/80 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-stone-500 font-sans mb-1">
              Exercises completed
            </p>
            <p className="text-3xl font-serif font-semibold text-stone-800">
              {stats.totalExercises}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white/80 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-stone-500 font-sans mb-1">
              Avg fillers / min
            </p>
            <p className="text-3xl font-serif font-semibold text-stone-800">
              {stats.averageFPM.toFixed(1)}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white/80 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-stone-500 font-sans mb-1">
              Best (lowest) FPM
            </p>
            <p className="text-3xl font-serif font-semibold text-stone-800">
              {bestFPM.toFixed(1)}
            </p>
          </div>
        </section>

        {/* Trend indicator */}
        <section className="rounded-xl border border-stone-200 bg-white/80 p-4 shadow-sm">
          <p className="text-sm font-serif text-stone-800">{trendMessage}</p>
        </section>

        {/* Exercise history */}
        <section className="space-y-4">
          <h2 className="text-lg font-serif font-semibold text-stone-800">
            Exercise history
          </h2>
          {sorted.length === 0 ? (
            <p className="text-sm text-stone-600 font-sans">
              You haven&apos;t completed any exercises yet. Once you finish a practice,
              your results will appear here.
            </p>
          ) : (
            <ul className="space-y-3">
              {sorted.map((entry, index) => {
                const current = entry.fillersPerMinute;
                const previous = sorted[index + 1]?.fillersPerMinute;
                let indicator: string | null = null;
                if (typeof previous === "number") {
                  if (current < previous) {
                    indicator = "Improved from last time";
                  } else if (current > previous) {
                    indicator = "Higher than last time";
                  } else {
                    indicator = "Same as last time";
                  }
                }

                return (
                  <li
                    key={entry.timestamp + entry.topic}
                    className="rounded-lg border border-stone-200 bg-white/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div>
                      <p className="font-serif text-stone-800">
                        {entry.topic || "Practice"}
                      </p>
                      <p className="text-xs text-stone-500 font-sans">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-sans text-stone-800">
                        {entry.fillersPerMinute.toFixed(1)} FPM
                      </p>
                      {indicator && (
                        <p className="text-xs text-stone-500 font-sans mt-0.5">
                          {indicator}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Local storage note */}
        <section>
          <p className="text-xs text-stone-500 font-sans">
            Your data is stored locally. Clearing browser data will erase your progress.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ProgressPage;

