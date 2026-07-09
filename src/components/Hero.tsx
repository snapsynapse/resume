import { useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { samProfile } from "@/data/sam-profile";
import { track } from "@/lib/analytics";
import { composeRoleContext, detectRoleSelection } from "@/lib/role-context";

interface HeroProps {
  onOpenChat: () => void;
}

const ROTATE_MS = 3000;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = () => setReduced(query.matches);
    setReduced(query.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

const Hero = ({ onOpenChat }: HeroProps) => {
  const [roleContext, setRoleContext] = useState(() => composeRoleContext({}));
  const titles = useMemo(
    () => roleContext?.heroTitles ?? samProfile.rotatingTitles ?? [samProfile.title],
    [roleContext?.heroTitles],
  );
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setRoleContext(composeRoleContext(detectRoleSelection()));
  }, []);

  useEffect(() => {
    setIndex(0);
    // Respect reduced-motion: hold on the primary title instead of cycling.
    if (prefersReducedMotion || titles.length < 2) return;
    const interval = window.setInterval(() => {
      setIndex((i) => (i + 1) % titles.length);
    }, ROTATE_MS);
    return () => window.clearInterval(interval);
  }, [titles, prefersReducedMotion]);

  const handleOpenChat = () => {
    track("ai_chat_opened", { source: "hero" });
    onOpenChat();
  };

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="min-h-screen flex flex-col justify-center px-6 pt-20"
    >
      <div className="max-w-5xl mx-auto w-full grid md:grid-cols-[1fr_auto] gap-10 items-center">
        <div>
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            <span className="text-sm text-muted-foreground">{roleContext?.status ?? samProfile.status}</span>
          </div>

          {/* Main heading */}
          <h1 id="about-heading" className="text-5xl md:text-7xl lg:text-8xl font-serif text-foreground mb-6 animate-slide-up">
            {samProfile.name}
          </h1>

          {/* Rotating role line — `key` change re-mounts the span so the fade-in animation re-runs.
              The animation is decorative and hidden from assistive tech; a single static label
              carries the primary title so screen readers are not re-announced on every rotation. */}
          <div className="text-2xl md:text-3xl text-primary font-serif mb-4 min-h-[2.5rem] md:min-h-[3rem]">
            <span key={index} aria-hidden="true" className="inline-block animate-fade-in">
              {titles[index]}
            </span>
            <span className="sr-only">{titles[0]}</span>
          </div>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-slide-up stagger-2">
            {samProfile.subtitle}
          </p>

          {/* CTA Button */}
          <button
            onClick={handleOpenChat}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-accent text-accent-foreground rounded-2xl font-medium transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/20 animate-slide-up stagger-4"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Ask AI About Sam</span>
          </button>
        </div>

        {/* Portrait */}
        <div className="row-start-1 md:row-auto md:col-start-2 animate-fade-in flex justify-center md:justify-end">
          <picture>
            <source
              type="image/webp"
              srcSet="/imgs/samrogers-256.webp 256w, /imgs/samrogers-512.webp 512w"
              sizes="(min-width: 1024px) 256px, (min-width: 768px) 224px, 160px"
            />
            <img
              src="/imgs/samrogers.png"
              alt="Sam Rogers"
              width={512}
              height={512}
              fetchpriority="high"
              decoding="async"
              className="w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full object-cover border-4 border-card shadow-lg"
            />
          </picture>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="pointer-events-none absolute bottom-12 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground animate-fade-in opacity-0 md:flex" style={{ animationDelay: "1.5s", animationFillMode: "forwards" }}>
        <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
        <div className="w-px h-8 bg-gradient-to-b from-muted-foreground to-transparent" />
      </div>
    </section>
  );
};

export default Hero;
