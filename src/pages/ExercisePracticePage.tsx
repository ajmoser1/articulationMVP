import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getExerciseById } from "@/data/exercises";
import { ExercisePlaceholder } from "@/components/exercises/ExercisePlaceholder";
import { GlassCard } from "@/components/ui/glass-card";
import { FuturismBlock } from "@/components/ui/FuturismBlock";
import Impromptu from "@/pages/Impromptu";
import { isExerciseImplemented } from "@/utils/exerciseStatus";

const ExercisePracticePage = () => {
  const { exerciseId = "" } = useParams();
  const exercise = getExerciseById(exerciseId);

  if (!exercise) {
    return (
      <div className="min-h-screen bg-gradient-layered px-6 py-8 pb-24 relative page-transition">
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <FuturismBlock variant="block-4" className="top-10 right-[-150px] opacity-38" borderColor="#4CC9F0" blendMode="normal" zIndex={1} />
          <FuturismBlock variant="stripe-2" className="bottom-20 left-[-170px] opacity-34" blendMode="normal" zIndex={1} />
        </div>
        <div className="max-w-3xl mx-auto relative z-10">
          <GlassCard className="p-8 space-y-4" hover={false}>
            <p className="text-2xl font-serif text-foreground">Exercise not found</p>
            <Link to="/exercises" className="text-sm text-primary font-sans hover:underline">
              Back to library
            </Link>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (!isExerciseImplemented(exercise.id)) {
    return (
      <div className="min-h-screen bg-gradient-layered px-6 py-8 pb-24 relative page-transition">
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <FuturismBlock variant="block-1" className="top-8 right-[-145px] opacity-40" borderColor="#7209B7" blendMode="normal" zIndex={1} />
          <FuturismBlock variant="triangle-2" className="top-[56%] left-[-170px] opacity-30" borderColor="#4ADE80" blendMode="normal" zIndex={1} />
          <FuturismBlock variant="stripe-3" className="bottom-20 right-[-180px] opacity-34" blendMode="normal" zIndex={1} />
        </div>
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <Link
            to={`/exercises/${exercise.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground font-sans hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to exercise details
          </Link>
          <ExercisePlaceholder exercise={exercise} />
        </div>
      </div>
    );
  }

  if (exercise.id === "impromptu-response") return <Impromptu />;
  if (exercise.id === "filler-words") return <Navigate to="/onboarding/topics?entry=library" replace />;

  return <Navigate to={`/exercises/${exercise.id}`} replace />;
};

export default ExercisePracticePage;
