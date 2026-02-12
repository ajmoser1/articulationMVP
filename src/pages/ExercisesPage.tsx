import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Clock3, Lock } from "lucide-react";
import { EXERCISES } from "@/data/exercises";
import { FuturismBlock } from "@/components/ui/FuturismBlock";
import { GlassCard } from "@/components/ui/glass-card";
import { isExerciseImplemented } from "@/utils/exerciseStatus";

type ModeFilter = "all" | "verbal" | "nonverbal";

const CATEGORY_COLORS: Record<string, string> = {
  fluency: "#4CC9F0",
  clarity: "#4A6741",
  precision: "#7209B7",
  confidence: "#5E8B6F",
  impact: "#DC2626",
};

const CATEGORY_LABELS: Record<string, string> = {
  fluency: "Fluency",
  clarity: "Clarity",
  precision: "Precision",
  confidence: "Confidence",
  impact: "Impact",
};

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

function toModeLabel(type: string): string {
  if (type === "written") return "Nonverbal";
  if (type === "both") return "Verbal + Nonverbal";
  return "Verbal";
}

const ExercisesPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ModeFilter>("all");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    foundation: true,
    precision: false,
    clarity: false,
    fluency: false,
    confidence: false,
    impact: false,
  });

  const visibleExercises = useMemo(() => {
    if (mode === "verbal") {
      return EXERCISES.filter((exercise) => exercise.type === "verbal" || exercise.type === "both");
    }
    if (mode === "nonverbal") {
      return EXERCISES.filter((exercise) => exercise.type === "written" || exercise.type === "both");
    }
    return EXERCISES;
  }, [mode]);

  const grouped = useMemo(() => {
    const list = {
      foundation: visibleExercises.filter((exercise) => exercise.tier === "foundation"),
      precision: visibleExercises.filter((exercise) => exercise.category === "precision"),
      clarity: visibleExercises.filter((exercise) => exercise.category === "clarity"),
      fluency: visibleExercises.filter((exercise) => exercise.category === "fluency"),
      confidence: visibleExercises.filter((exercise) => exercise.category === "confidence"),
      impact: visibleExercises.filter((exercise) => exercise.category === "impact"),
    };
    return list;
  }, [visibleExercises]);

  const toggle = (section: string) =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const renderExerciseCard = (exerciseId: string) => {
    const exercise = EXERCISES.find((item) => item.id === exerciseId);
    if (!exercise) return null;
    const available = isExerciseImplemented(exercise.id);
    const color = CATEGORY_COLORS[exercise.category] ?? "#4A6741";

    return (
      <button
        key={exercise.id}
        onClick={() => navigate(`/exercises/${exercise.id}`)}
        className="w-full text-left rounded-2xl p-4 border border-emerald-500/35 bg-background/70 transition-colors hover:border-emerald-400/55"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-background/75 border border-emerald-500/30 flex items-center justify-center text-lg">
              {ICON_EMOJI[exercise.icon] ?? "🧠"}
            </div>
            <div>
              <p className="font-serif text-foreground text-base">{exercise.name}</p>
              <p className="text-xs font-sans text-muted-foreground mt-1">{exercise.shortDescription}</p>
              <div className="mt-2 meta-row">
                <span className="meta-chip inline-flex items-center gap-1">
                  <Clock3 className="w-3 h-3" />~{Math.max(1, Math.round(exercise.estimatedTime / 60))} min
                </span>
                <span className="meta-chip">
                  {toModeLabel(exercise.type)}
                </span>
                <span className="meta-chip">
                  {exercise.tier}
                </span>
              </div>
            </div>
          </div>
          <span
            className={`text-xs font-sans px-2 py-1 rounded-full ${
              available ? "bg-emerald-500/15 text-emerald-700" : "bg-muted/40 text-muted-foreground"
            }`}
          >
            {available ? "✓ Available" : "🔒 Coming Soon"}
          </span>
        </div>
      </button>
    );
  };

  const sections: Array<{ id: keyof typeof grouped; title: string; subtitle: string }> = [
    { id: "foundation", title: "Foundation Exercises", subtitle: "Core drills to build reliable basics." },
    { id: "precision", title: "Precision Exercises", subtitle: "Sharpen wording and reduce vague language." },
    { id: "clarity", title: "Clarity Exercises", subtitle: "Structure ideas and speak in cleaner sequences." },
    { id: "fluency", title: "Fluency Exercises", subtitle: "Reduce verbal friction and filler habits." },
    { id: "confidence", title: "Confidence Exercises", subtitle: "Strengthen assertive communication under pressure." },
    { id: "impact", title: "Impact Exercises", subtitle: "Make ideas memorable and persuasive." },
  ];

  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-8 pb-28 relative page-transition">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <FuturismBlock
          variant="block-3"
          className="top-8 right-[-150px] opacity-40"
          borderColor="#7209B7"
          blendMode="normal"
          zIndex={1}
        />
        <FuturismBlock
          variant="block-4"
          className="top-24 left-[-130px] opacity-34"
          borderColor="#4ADE80"
          blendMode="normal"
          zIndex={2}
        />
        <FuturismBlock
          variant="triangle-1"
          className="top-[56%] right-[-170px] opacity-30"
          borderColor="#4CC9F0"
          blendMode="normal"
          zIndex={1}
        />
        <FuturismBlock
          variant="stripe-3"
          className="bottom-20 left-[-190px] opacity-36"
          blendMode="normal"
          zIndex={1}
        />
      </div>
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 relative z-10">
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl font-serif font-bold text-foreground">Exercise Library</h1>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-glass h-10 px-4 text-sm font-sans"
            >
              Back to Dashboard
            </button>
          </div>
          <p className="text-sm text-muted-foreground font-sans">
            Browse by category. Open a category to view exercises.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All" },
              { id: "verbal", label: "Verbal" },
              { id: "nonverbal", label: "Nonverbal" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setMode(filter.id as ModeFilter)}
                className={`px-3 py-2 rounded-xl text-sm font-sans ${
                  mode === filter.id ? "bg-primary/15 text-primary" : "glass-subtle text-muted-foreground"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </header>

        {sections.map((section) => {
          const items = grouped[section.id];
          if (items.length === 0) return null;
          const isOpen = !!openSections[section.id];
          const status = `${items.filter((exercise) => isExerciseImplemented(exercise.id)).length}/${items.length} available`;

          return (
            <GlassCard key={section.id} className="p-4 section-block" hover={false}>
              <button
                onClick={() => toggle(section.id)}
                className="w-full flex items-center justify-between gap-3"
              >
                <div className="text-left">
                  <p className="font-serif text-lg text-foreground">{section.title}</p>
                  <p className="text-xs text-muted-foreground font-sans">{section.subtitle}</p>
                  {section.id !== "foundation" && (
                    <p className="text-[11px] mt-1 font-sans" style={{ color: CATEGORY_COLORS[section.id] }}>
                      {CATEGORY_LABELS[section.id]} • {status}
                    </p>
                  )}
                </div>
                {isOpen ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {isOpen && (
                <div className="mt-4 grid gap-3">
                  {items.map((exercise) => renderExerciseCard(exercise.id))}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

export default ExercisesPage;
