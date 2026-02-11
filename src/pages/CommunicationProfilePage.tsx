import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Download, Share2, Star, TriangleAlert } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { FuturismBlock } from "@/components/ui/FuturismBlock";
import { determineArchetype } from "@/data/archetypes";
import { getUserProgress } from "@/utils/storage";
import type { CommunicationScore, UserProgress } from "@/types/exercise";
import { useScrollReveal } from "@/hooks/useScrollReveal";

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
  if (value >= 60) return "bg-amber-400/80";
  return "bg-red-500/80";
};

const CommunicationProfilePage = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    setProgress(getUserProgress(USER_ID));
  }, []);

  const heroReveal = useScrollReveal({ threshold: 0.2 });
  const scoreReveal = useScrollReveal({ threshold: 0.2 });
  const subscoresReveal = useScrollReveal({ threshold: 0.25 });
  const insightsReveal = useScrollReveal({ threshold: 0.3 });
  const pathReveal = useScrollReveal({ threshold: 0.35 });

  const score = progress?.communicationScore;
  const overallScore = score ? clamp(score.overall, 0, 100) : 0;
  const percentile = getPercentile(overallScore);
  const starCount = getStarCount(overallScore);

  const archetype = useMemo(() => {
    if (!score) return null;
    return determineArchetype(score);
  }, [score]);

  const archetypeEmoji = ARCHETYPE_EMOJI[archetype?.id ?? "generic-speaker"];

  const scoreValues = useMemo(() => {
    return SCORE_LABELS.map(({ key, label }) => {
      const value = score?.[key] ?? null;
      return { key, label, value };
    });
  }, [score]);

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
 
  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-10 pb-32 flex flex-col relative page-transition">
      <FuturismBlock
        variant="block-1"
        className="top-6 right-[-120px] futurism-intense"
        borderColor="#4CC9F0"
        zIndex={1}
      />
      <FuturismBlock
        variant="block-3"
        className="top-24 left-[-120px] futurism-intense"
        borderColor="#F72585"
        zIndex={2}
      />
      <FuturismBlock
        variant="stripe-2"
        className="top-40 right-[-160px]"
        zIndex={1}
      />

      <div className="max-w-2xl mx-auto w-full flex flex-col gap-8 relative z-10">
        <section
          ref={heroReveal.ref}
          className={`section-reveal ${heroReveal.isVisible ? "is-visible" : ""}`}
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
          className={`section-reveal ${scoreReveal.isVisible ? "is-visible" : ""}`}
        >
          <GlassCard className="p-8 space-y-6" hover={false}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground font-sans">
                  Overall score
                </p>
                <p className="text-5xl font-serif font-bold text-foreground">
                  {overallScore}
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
                className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
                style={{ width: `${overallScore}%` }}
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
          className={`section-reveal ${subscoresReveal.isVisible ? "is-visible" : ""}`}
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
                      style={{ width: `${item.value ?? 12}%` }}
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
          className={`section-reveal ${insightsReveal.isVisible ? "is-visible" : ""}`}
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
          className={`section-reveal ${pathReveal.isVisible ? "is-visible" : ""}`}
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
