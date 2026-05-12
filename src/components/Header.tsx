import { useState, useEffect } from "react";
import type { MouseEvent } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenChat?: () => void;
}

const Header = ({ onOpenChat }: HeaderProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSectionLink =
    (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      scrollToSection(id);
    };

  const handleAskAI = () => {
    setMobileMenuOpen(false);
    if (onOpenChat) {
      onOpenChat();
    } else {
      scrollToSection("experience");
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between" aria-label="Resume navigation">
        <a
          href="https://sam-rogers.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Sam Rogers — main site"
          className="font-serif text-xl text-foreground hover:text-primary transition-colors"
        >
          SR
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#about"
            onClick={handleSectionLink("about")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </a>
          <a
            href="#experience"
            onClick={handleSectionLink("experience")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Experience
          </a>
          <a
            href="#fit-assessment"
            onClick={handleSectionLink("fit-assessment")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Analyze Fit
          </a>
          <a
            href="#contact"
            onClick={handleSectionLink("contact")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </a>
          <button
            onClick={handleAskAI}
            className="text-sm px-4 py-2 bg-accent text-accent-foreground rounded-full hover:opacity-90 transition-opacity"
          >
            Ask AI About Sam
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="md:hidden bg-card border-b border-border animate-slide-down">
          <div className="px-6 py-4 space-y-4">
            <a
              href="#about"
              onClick={handleSectionLink("about")}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </a>
            <a
              href="#experience"
              onClick={handleSectionLink("experience")}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors"
            >
              Experience
            </a>
            <a
              href="#fit-assessment"
              onClick={handleSectionLink("fit-assessment")}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors"
            >
              Analyze Fit
            </a>
            <a
              href="#contact"
              onClick={handleSectionLink("contact")}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
            <button
              onClick={handleAskAI}
              className="block w-full text-left text-accent hover:opacity-80 transition-opacity"
            >
              Ask AI About Sam
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
