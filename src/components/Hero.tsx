import { MessageSquare } from "lucide-react";
import { samProfile } from "@/data/sam-profile";

interface HeroProps {
  onOpenChat: () => void;
}

const Hero = ({ onOpenChat }: HeroProps) => {
  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col justify-center px-6 pt-20"
    >
      <div className="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_auto] gap-10 items-center">
        <div>
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            <span className="text-sm text-muted-foreground">{samProfile.status}</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-foreground mb-6 animate-slide-up">
            {samProfile.name}
          </h1>

          {/* Role */}
          <p className="text-2xl md:text-3xl text-primary font-serif mb-4 animate-slide-up stagger-1">
            {samProfile.title}
          </p>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 animate-slide-up stagger-2">
            {samProfile.subtitle}
          </p>

          {/* Company badges */}
          <div className="flex flex-wrap gap-3 mb-12 animate-slide-up stagger-3">
            {samProfile.companies.map((company) => (
              <span
                key={company}
                className="px-4 py-2 bg-card border border-border rounded-full text-sm text-foreground"
              >
                {company}
              </span>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={onOpenChat}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-accent text-accent-foreground rounded-2xl font-medium transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/20 animate-slide-up stagger-4"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Ask AI About Me</span>
            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-success text-primary-foreground rounded-full text-xs font-medium">
              New
            </span>
          </button>
        </div>

        {/* Portrait */}
        <div className="row-start-1 md:row-auto md:col-start-2 animate-fade-in flex justify-center md:justify-end">
          <img
            src="/imgs/samrogers.png"
            alt="Sam Rogers"
            className="w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full object-cover border-4 border-card shadow-lg"
          />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground animate-fade-in opacity-0" style={{ animationDelay: "1.5s", animationFillMode: "forwards" }}>
        <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
        <div className="w-px h-8 bg-gradient-to-b from-muted-foreground to-transparent" />
      </div>
    </section>
  );
};

export default Hero;
