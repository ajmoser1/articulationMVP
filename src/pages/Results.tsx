import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  analyzeFillerWords,
  type FillerAnalysisResult,
  type FillerCategory,
} from "@/lib/fillerWords";
import { Button } from "@/components/ui/button";

const TYPEWRITER_MS_PER_CHAR = 50;

type ResultsLocationState = {
  transcript?: string;
  analysisResults?: FillerAnalysisResult;
  durationMinutes?: number;
} | null;

/** Build segments of visible transcript with filler ranges highlighted */
function buildSegments(
  transcript: string,
  visibleLength: number,
  fillerPositions: { word: string; position: number }[]
): { type: "normal" | "filler"; text: string }[] {
  if (visibleLength <= 0) return [];
  const ranges = fillerPositions
    .map((f) => ({ start: f.position, end: f.position + f.word.length }))
    .filter((r) => r.end > 0 && r.start < visibleLength)
    .sort((a, b) => a.start - b.start);

  const segments: { type: "normal" | "filler"; text: string }[] = [];
  let pos = 0;
  for (const r of ranges) {
    const clipStart = Math.max(r.start, 0);
    const clipEnd = Math.min(r.end, visibleLength);
    if (pos < clipStart) {
      segments.push({
        type: "normal",
        text: transcript.slice(pos, clipStart),
      });
    }
    if (clipStart < clipEnd) {
      segments.push({
        type: "filler",
        text: transcript.slice(clipStart, clipEnd),
      });
    }
    pos = clipEnd;
  }
  if (pos < visibleLength) {
    segments.push({ type: "normal", text: transcript.slice(pos, visibleLength) });
  }
  return segments;
}

/** Filler start positions for triggering flash when typewriter reaches them */
function getFillerStartPositions(
  fillerPositions: { word: string; position: number }[]
): Set<number> {
  return new Set(fillerPositions.map((f) => f.position));
}

const CATEGORY_LABELS: Record<FillerCategory, string> = {
  hesitation: "Hesitation",
  discourse: "Discourse",
  temporal: "Temporal",
  thinking: "Thinking",
};

function getDistributionInsight(
  dist: { beginning: number; middle: number; end: number }
): string {
  const { beginning, middle, end } = dist;
  const total = beginning + middle + end;
  if (total === 0) return "No fillers detected.";
  const max = Math.max(beginning, middle, end);
  if (beginning === middle && middle === end) {
    return "Fillers are spread evenly through your speech.";
  }
  if (max === beginning) {
    return "You use more fillers at the beginning—consider pausing to gather your thoughts before starting.";
  }
  if (max === middle) {
    return "Most fillers appear in the middle—practicing mid-speech pauses could help.";
  }
  return "You use more fillers toward the end—try wrapping up with a clear conclusion.";
}

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultsLocationState;
  const transcript = state?.transcript;
  const passedAnalysis = state?.analysisResults;
  const durationMinutes = state?.durationMinutes ?? 1;

  const analysisResults = useMemo(() => {
    if (typeof transcript !== "string" || transcript.trim() === "") return null;
    if (passedAnalysis) return passedAnalysis;
    return analyzeFillerWords(transcript, durationMinutes);
  }, [transcript, durationMinutes, passedAnalysis]);

  const [visibleLength, setVisibleLength] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const [typewriterDone, setTypewriterDone] = useState(false);

  const fillerStarts = useMemo(
    () =>
      analysisResults ? getFillerStartPositions(analysisResults.fillerPositions) : new Set<number>(),
    [analysisResults]
  );

  useEffect(() => {
    if (typeof transcript !== "string" || transcript.length === 0) return;
    setVisibleLength(0);
    setTypewriterDone(false);
    let index = 0;
    const len = transcript.length;
    const interval = setInterval(() => {
      index += 1;
      if (index > len) {
        clearInterval(interval);
        setTypewriterDone(true);
        return;
      }
      setVisibleLength(index);
      if (fillerStarts.has(index - 1)) {
        setFlashKey((k) => k + 1);
      }
    }, TYPEWRITER_MS_PER_CHAR);
    return () => clearInterval(interval);
  }, [transcript, fillerStarts]);

  useEffect(() => {
    if (typeof transcript !== "string" || transcript.trim() === "") {
      navigate("/practice", { replace: true });
    }
  }, [transcript, navigate]);

  const segments = useMemo(() => {
    if (typeof transcript !== "string" || !analysisResults) return [];
    return buildSegments(
      transcript,
      visibleLength,
      analysisResults.fillerPositions
    );
  }, [transcript, visibleLength, analysisResults]);

  const distributionInsight = useMemo(() => {
    if (!analysisResults) return "";
    return getDistributionInsight(analysisResults.distributionAnalysis);
  }, [analysisResults]);

  const topFiveFillers = useMemo(() => {
    if (!analysisResults?.specificFillerCounts) return [];
    return Object.entries(analysisResults.specificFillerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [analysisResults]);

  if (typeof transcript !== "string" || transcript.trim() === "" || !analysisResults) {
    return null;
  }

  const { totalFillerWords, fillersPerMinute, categoryCounts, distributionAnalysis } =
    analysisResults;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#FAF9F6" }}
    >
      {/* Flash overlay: remount per flash so animation runs */}
      {flashKey > 0 && <div key={flashKey} className="results-flash-overlay" />}

      <div className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full flex flex-col gap-10">
        {/* Top metrics */}
        <section className="flex flex-wrap gap-8 gap-y-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-stone-500 font-sans mb-1">
              Total filler words
            </p>
            <p className="text-4xl font-serif font-bold text-stone-800 tabular-nums">
              {totalFillerWords}
            </p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-stone-500 font-sans mb-1">
              Fillers per minute
            </p>
            <p className="text-4xl font-serif font-bold text-stone-800 tabular-nums">
              {fillersPerMinute.toFixed(1)}
            </p>
          </div>
        </section>

        {/* Transcript with typewriter and filler highlight */}
        <section>
          <p className="text-sm uppercase tracking-wide text-stone-500 font-sans mb-3">
            Your transcript
          </p>
          <div
            className="rounded-xl border border-stone-200 p-6 shadow-sm font-serif text-stone-800 leading-relaxed whitespace-pre-wrap"
            style={{ backgroundColor: "#FAF9F6", minHeight: "8rem" }}
          >
            {segments.map((seg, i) =>
              seg.type === "filler" ? (
                <span
                  key={i}
                  className="bg-red-100 text-red-800 rounded px-0.5"
                  style={{ backgroundColor: "rgba(254, 226, 226, 0.9)", color: "#991b1b" }}
                >
                  {seg.text}
                </span>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
            {!typewriterDone && (
              <span className="inline-block w-2 h-4 bg-stone-600 animate-pulse ml-0.5 align-baseline" />
            )}
          </div>
        </section>

        {/* Detailed metrics */}
        <section className="space-y-6">
          <h2 className="text-lg font-serif font-semibold text-stone-800">
            Breakdown
          </h2>

          <div>
            <p className="text-sm text-stone-500 font-sans mb-2">
              By category
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-1 text-stone-700 font-sans">
              {(Object.keys(categoryCounts) as FillerCategory[]).map((cat) => (
                <li key={cat}>
                  {CATEGORY_LABELS[cat]}: {categoryCounts[cat]}
                </li>
              ))}
            </ul>
          </div>

          {topFiveFillers.length > 0 && (
            <div>
              <p className="text-sm text-stone-500 font-sans mb-2">
                Top fillers
              </p>
              <ul className="text-stone-700 font-sans space-y-1">
                {topFiveFillers.map(([word, count]) => (
                  <li key={word}>
                    &ldquo;{word}&rdquo; — {count}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-sm text-stone-500 font-sans mb-2">
              Distribution
            </p>
            <p className="text-stone-700 font-sans">
              Beginning: {distributionAnalysis.beginning}, Middle:{" "}
              {distributionAnalysis.middle}, End: {distributionAnalysis.end}
            </p>
            <p className="mt-2 text-stone-600 font-serif text-sm italic">
              {distributionInsight}
            </p>
          </div>
        </section>

        {/* Buttons */}
        <section className="flex flex-wrap gap-4 pt-4">
          <Button
            onClick={() => navigate("/topics")}
            className="bg-[hsl(15,60%,50%)] hover:bg-[hsl(15,60%,45%)] text-white font-sans"
          >
            Try Another Topic
          </Button>
          <Button
            variant="secondary"
            disabled
            className="font-sans text-stone-500 cursor-not-allowed"
          >
            View Progress
          </Button>
        </section>
      </div>
    </div>
  );
};

export default Results;
