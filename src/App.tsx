import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Questionnaire from "./pages/Questionnaire";
import TopicSelection from "./pages/TopicSelection";
import Practice from "./pages/Practice";
import Results from "./pages/Results";
import DashboardPage from "./pages/DashboardPage";
import ExercisesPage from "./pages/ExercisesPage";
import ExerciseDetailPage from "./pages/ExerciseDetailPage";
import ExercisePracticePage from "./pages/ExercisePracticePage";
import ProgressPage from "./pages/ProgressPage";
import ProfilePage from "./pages/ProfilePage";
import CommunicationProfilePage from "./pages/CommunicationProfilePage";
import OnboardingBenefitsPage from "./pages/OnboardingBenefitsPage";
import Impromptu from "./pages/Impromptu";
import ImpromptuResults from "./pages/ImpromptuResults";
import NotFound from "./pages/NotFound";
import { BottomNav } from "@/components/BottomNav";
import { useStreak } from "@/hooks/useStreak";

const queryClient = new QueryClient();

const getOnboardingComplete = () =>
  typeof window !== "undefined" && window.localStorage.getItem("onboarding_complete") === "true";

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return null;
};

const AppRoutes = () => {
  useStreak();
  const location = useLocation();
  const showBottomNav = ["/dashboard", "/exercises", "/progress", "/profile"].some((path) =>
    location.pathname.startsWith(path)
  );
  const onboardingComplete = getOnboardingComplete();

  return (
    <>
      <ScrollToTop />
      <div key={location.pathname} className="route-fade-slide">
        <Routes location={location}>
          <Route
            path="/"
            element={
              <Navigate
                to={onboardingComplete ? "/dashboard" : "/onboarding"}
                replace
              />
            }
          />

        {/* Onboarding flow */}
        <Route path="/onboarding" element={<Welcome />} />
        <Route path="/onboarding/questionnaire" element={<Questionnaire />} />
        <Route path="/onboarding/topics" element={<TopicSelection />} />
        <Route path="/onboarding/practice" element={<Practice />} />
        <Route path="/onboarding/results" element={<Results />} />
        <Route path="/onboarding/benefits" element={<OnboardingBenefitsPage />} />

        {/* Legacy redirects */}
        <Route path="/questionnaire" element={<Navigate to="/onboarding/questionnaire" replace />} />
        <Route path="/topics" element={<Navigate to="/onboarding/topics" replace />} />
        <Route path="/practice" element={<Navigate to="/onboarding/practice" replace />} />
        <Route path="/results" element={<Navigate to="/onboarding/results" replace />} />

        <Route path="/communication-profile" element={<CommunicationProfilePage />} />

        {/* Main app */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/exercises" element={<ExercisesPage />} />
        <Route path="/exercises/:exerciseId" element={<ExerciseDetailPage />} />
        <Route path="/exercises/:exerciseId/practice" element={<ExercisePracticePage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/impromptu" element={<Impromptu />} />
        <Route path="/impromptu-results" element={<ImpromptuResults />} />

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {showBottomNav && <BottomNav />}
    </>
  );
};

const App = () => {
  useEffect(() => {
    const root = document.documentElement;
    const isLowPerf =
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      ("deviceMemory" in navigator && (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isLowPerf) {
      root.setAttribute("data-perf", "low");
    }

    const enableTextures = () => root.classList.add("textures-ready");
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => enableTextures());
    } else {
      window.setTimeout(enableTextures, 300);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );

    const observeExisting = () => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal='true']")
        .forEach((el) => observer.observe(el));
    };

    observeExisting();

    const mutationObserver = new MutationObserver(() => observeExisting());
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
