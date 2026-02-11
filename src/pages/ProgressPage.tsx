import { GlassCard } from "@/components/ui/glass-card";
import { FuturismBlock } from "@/components/ui/FuturismBlock";

const ProgressPage = () => {
  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-8 pb-28 flex flex-col relative page-transition">
      <FuturismBlock
        variant="block-2"
        className="top-6 right-[-140px] futurism-strong"
        borderColor="#F72585"
        zIndex={1}
      />
      <FuturismBlock
        variant="triangle-1"
        className="top-[70vh] left-[-160px] futurism-strong"
        borderColor="#4CC9F0"
        zIndex={2}
      />
      <div className="max-w-md mx-auto w-full flex flex-col gap-6 relative z-10">
        <header>
          <h1 className="text-3xl font-serif font-bold text-foreground">Progress</h1>
          <p className="text-muted-foreground font-sans">
            Track streaks, XP, and score trends.
          </p>
        </header>
        <GlassCard className="p-6" hover={false}>
          <p className="text-foreground font-sans">
            Progress dashboard coming next.
          </p>
        </GlassCard>
      </div>
    </div>
  );
};

export default ProgressPage;
