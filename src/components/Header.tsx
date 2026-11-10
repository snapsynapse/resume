import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

// Broadcast to DecisionBriefSidebar to open its mobile overlay. Kept as a plain
// window event so Header and the sidebar stay decoupled (no shared parent state).
export const OPEN_INTERVIEW_BRIEF_EVENT = "resume:open-interview-brief";

export interface OpenInterviewBriefEventDetail {
  returnFocusTo: HTMLElement | null;
}

// In-page sections. The href is the static crawl page for the same section, so the
// link still works without JavaScript; with it, the click scrolls in place instead.
const SECTIONS = [
  { id: "experience", href: "/experience/", label: "Experience" },
  { id: "fit-assessment", href: "/fit-assessment/", label: "Analyze Fit" },
  { id: "contact", href: "/contact/", label: "Contact" },
] as const;

const ASK_LABEL = "Ask AI About Sam";

// Lazy-mounted sections above the target (the fit assessment, for one) can grow from a
// short placeholder to full height after a smooth scroll starts, leaving the target short
// of the viewport. Re-issue the scroll until its position holds still for three checks,
// giving up after two seconds.
function scrollUntilSettled(target: HTMLElement) {
  target.scrollIntoView({ behavior: "smooth" });
  const deadline = Date.now() + 2000;
  let previousTop = Number.POSITIVE_INFINITY;
  let stableChecks = 0;
  const check = () => {
    const top = target.getBoundingClientRect().top;
    if (Math.abs(top - previousTop) < 2) {
      stableChecks += 1;
    } else {
      stableChecks = 0;
      target.scrollIntoView({ behavior: "smooth" });
    }
    previousTop = top;
    if (stableChecks < 3 && Date.now() < deadline) window.setTimeout(check, 120);
  };
  window.setTimeout(check, 120);
}

function useScrolledPast(offset: number) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const update = () => setPast(window.scrollY > offset);
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [offset]);
  return past;
}

interface HeaderProps {
  onOpenChat?: () => void;
}

const Header = ({ onOpenChat }: HeaderProps) => {
  const scrolled = useScrolledPast(50);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  const goTo = (id: string) => {
    setMenuOpen(false);
    const target = document.getElementById(id);
    if (target) scrollUntilSettled(target);
  };

  const onSectionClick = (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    track("nav_section_clicked", { section: id });
    goTo(id);
  };

  const askAI = () => {
    setMenuOpen(false);
    track("ai_chat_opened", { source: "header" });
    if (onOpenChat) onOpenChat();
    else goTo("experience");
  };

  const openBrief = () => {
    setMenuOpen(false);
    track("nav_section_clicked", { section: "interview-brief" });
    window.dispatchEvent(
      new CustomEvent<OpenInterviewBriefEventDetail>(OPEN_INTERVIEW_BRIEF_EVENT, {
        detail: { returnFocusTo: menuButton.current },
      }),
    );
  };

  const sectionLinks = (className: string) =>
    SECTIONS.map(({ id, href, label }) => (
      <a key={id} href={href} onClick={onSectionClick(id)} className={className}>
        {label}
      </a>
    ));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-border bg-background/80 backdrop-blur-lg" : "bg-transparent",
      )}
    >
      <nav aria-label="Resume navigation" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a
          href="https://sam-rogers.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Sam Rogers - main site"
          className="font-serif text-xl text-foreground transition-colors hover:text-primary"
        >
          Sam Rogers
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {sectionLinks("text-sm text-muted-foreground transition-colors hover:text-foreground")}
          <button
            type="button"
            onClick={askAI}
            className="rounded-full bg-accent px-4 py-2 text-sm text-accent-foreground transition-opacity hover:opacity-90"
          >
            {ASK_LABEL}
          </button>
        </div>

        <button
          ref={menuButton}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          className="p-2 text-muted-foreground hover:text-foreground md:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {menuOpen ? (
        <div id="mobile-navigation" className="animate-slide-down border-b border-border bg-card md:hidden">
          <div className="flex flex-col items-start gap-4 px-6 py-4 text-muted-foreground [&>*]:w-full [&>*]:text-left [&>*]:transition-colors">
            {sectionLinks("block hover:text-foreground")}
            <button type="button" onClick={openBrief} className="hover:text-foreground">
              Interview brief
            </button>
            <button type="button" onClick={askAI} className="text-accent hover:opacity-80">
              {ASK_LABEL}
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Header;
