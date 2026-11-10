import { useId, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import type { samProfile } from "@/data/sam-profile";

// Not every role carries a note, so the union from the data is widened to make it optional.
type Role = (typeof samProfile.experience)[number] & { note?: string };

// Order and labels for the per-role context panel. The last entry renders as a quote.
const CONTEXT_FIELDS: ReadonlyArray<{ key: keyof Role["aiContext"]; label: string; quote?: boolean }> = [
  { key: "situation", label: "Situation" },
  { key: "approach", label: "Approach" },
  { key: "technicalWork", label: "Technical work" },
  { key: "lessonsLearned", label: "Lesson learned", quote: true },
];

type ExperienceCardProps = Role & { index: number };

const ExperienceCard = ({ company, role, period, highlights, note, aiContext, index }: ExperienceCardProps) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const toggle = () => {
    const next = !open;
    track("experience_context_toggled", { expanded: next });
    setOpen(next);
  };

  return (
    <article
      className="animate-slide-up opacity-0 rounded-2xl border border-border bg-card p-6 transition-colors duration-300 hover:border-accent/50 md:p-8"
      style={{ animationDelay: `${0.2 + index * 0.1}s`, animationFillMode: "forwards" }}
    >
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="mb-1 font-serif text-2xl text-foreground">{company}</h3>
          <p className="text-primary">{role}</p>
        </div>
        <span className="font-mono text-sm text-muted-foreground">{period}</span>
      </header>

      <ul className="mb-6 space-y-3 text-muted-foreground">
        {highlights.map((line) => (
          <li key={line} className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-1.5 text-accent">→</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {note ? (
        <p className="mb-6 border-l-2 border-accent/40 pl-3 text-sm italic text-muted-foreground">{note}</p>
      ) : null}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex items-center gap-2 text-sm text-accent transition-colors hover:text-accent/80"
      >
        <Sparkles aria-hidden="true" className="h-4 w-4" />
        {open ? "Hide context" : "Show context"}
        <ChevronDown aria-hidden="true" className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <dl id={panelId} className="animate-slide-down mt-4 grid gap-4 rounded-xl border border-border bg-secondary p-4 text-sm">
          {CONTEXT_FIELDS.map(({ key, label, quote }) => (
            <div key={key}>
              <dt className="font-mono text-xs uppercase tracking-wider text-text-subtle">{label}</dt>
              <dd className={cn("mt-1", quote ? "italic text-text-highlight" : "text-foreground")}>
                {quote ? `“${aiContext[key]}”` : aiContext[key]}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
};

export default ExperienceCard;
