import { lazy, Suspense, useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Experience from "@/components/Experience";
import type { FitResult } from "@/components/FitAssessment";
import BookingCTA from "@/components/BookingCTA";
import Footer from "@/components/Footer";
import DecisionBriefSidebar from "@/components/DecisionBriefSidebar";
import LazyOnVisible from "@/components/LazyOnVisible";

const FitAssessment = lazy(() => import("@/components/FitAssessment"));
const AIChat = lazy(() => import("@/components/AIChat"));

const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [fitResult, setFitResult] = useState<FitResult | null>(null);
  const [hasJobDescription, setHasJobDescription] = useState(false);

  const openChat = () => setIsChatOpen(true);

  return (
    <div className="min-h-screen bg-background">
      <Header onOpenChat={openChat} />
      <div className="lg:grid lg:grid-cols-[auto_minmax(0,1fr)]">
        <DecisionBriefSidebar
          fitResult={fitResult}
          hasJobDescription={hasJobDescription}
        />
        <div className="min-w-0">
          <main aria-label="Sam Rogers resume">
            <Hero onOpenChat={openChat} />
            <Experience />
            <LazyOnVisible
              fallback={<div id="fit-assessment" className="min-h-[24rem]" />}
            >
              <Suspense fallback={<div id="fit-assessment" className="min-h-[24rem]" />}>
                <FitAssessment
                  onResult={setFitResult}
                  onJobDescriptionStateChange={setHasJobDescription}
                />
              </Suspense>
            </LazyOnVisible>
            <BookingCTA />
          </main>
          <Footer />
        </div>
      </div>
      {isChatOpen && (
        <Suspense fallback={null}>
          <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default Index;
