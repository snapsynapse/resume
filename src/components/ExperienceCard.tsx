import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

interface AIContext {
  situation: string;
  approach: string;
  technicalWork: string;
  lessonsLearned: string;
}

interface ExperienceCardProps {
  company: string;
  role: string;
  period: string;
  highlights: string[];
  note?: string;
  aiContext: AIContext;
  index: number;
}

const ExperienceCard = ({
  company,
  role,
  period,
  highlights,
  note,
  aiContext,
  index,
}: ExperienceCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const handleToggle = () => {
    track("experience_context_toggled", { company, expanded: !expanded });
    setExpanded(!expanded);
  };

  return (
    <article
      className={cn(
        "group relative p-6 md:p-8 bg-card border border-border rounded-2xl transition-all duration-300 hover:border-accent/50",
        "animate-slide-up opacity-0"
      )}
      style={{ animationDelay: `${index * 0.1 + 0.2}s`, animationFillMode: "forwards" }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-serif text-foreground mb-1">{company}</h3>
          <p className="text-primary">{role}</p>
        </div>
        <span className="text-sm font-mono text-muted-foreground">{period}</span>
      </div>

      {/* Highlights */}
      <ul className="space-y-3 mb-6">
        {highlights.map((highlight, i) => (
          <li key={i} className="flex items-start gap-3 text-muted-foreground">
            <span className="text-accent mt-1.5">→</span>
            <span>{highlight}</span>
          </li>
        ))}
      </ul>

      {/* Card note */}
      {note && (
        <p className="mb-6 text-sm text-muted-foreground border-l-2 border-accent/40 pl-3 italic">
          {note}
        </p>
      )}

      {/* AI Context Toggle */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        <span>{expanded ? "Hide" : "View"} AI Context</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Expanded AI Context */}
      {expanded && (
        <div className="mt-4 p-4 bg-secondary rounded-xl border border-border animate-slide-down">
          <div className="grid gap-4 text-sm">
            <div>
              <span className="text-text-subtle font-mono text-xs uppercase tracking-wider">
                Situation
              </span>
              <p className="text-foreground mt-1">{aiContext.situation}</p>
            </div>
            <div>
              <span className="text-text-subtle font-mono text-xs uppercase tracking-wider">
                Approach
              </span>
              <p className="text-foreground mt-1">{aiContext.approach}</p>
            </div>
            <div>
              <span className="text-text-subtle font-mono text-xs uppercase tracking-wider">
                Technical Work
              </span>
              <p className="text-foreground mt-1">{aiContext.technicalWork}</p>
            </div>
            <div>
              <span className="text-text-subtle font-mono text-xs uppercase tracking-wider">
                Lessons Learned
              </span>
              <p className="text-text-highlight mt-1 italic">"{aiContext.lessonsLearned}"</p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default ExperienceCard;
