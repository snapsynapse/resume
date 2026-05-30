import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Experience from "@/components/Experience";
import FitAssessment, { type FitResult } from "@/components/FitAssessment";
import BookingCTA from "@/components/BookingCTA";
import AIChat from "@/components/AIChat";
import Footer from "@/components/Footer";
import DecisionBriefSidebar from "@/components/DecisionBriefSidebar";

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
            <FitAssessment
              onResult={setFitResult}
              onJobDescriptionStateChange={setHasJobDescription}
            />
            <BookingCTA />
          </main>
          <Footer />
        </div>
      </div>
      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default Index;
