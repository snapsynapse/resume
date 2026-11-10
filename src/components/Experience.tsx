import { samProfile } from "@/data/sam-profile";
import ExperienceCard from "./ExperienceCard";

type SkillTier = keyof typeof samProfile.skills;

// Evidence tiers, strongest first. Each tier names what qualifies a skill for it.
const TIERS: ReadonlyArray<{
  tier: SkillTier;
  heading: string;
  rule: string;
  mark: string;
  panel: string;
  accent: string;
}> = [
  {
    tier: "strong",
    heading: "Strong",
    rule: "Repeated, shipped, or quantified evidence.",
    mark: "✓",
    panel: "border-success/20 bg-success-muted",
    accent: "text-success",
  },
  {
    tier: "moderate",
    heading: "Moderate",
    rule: "Real exposure; less depth or scale than the strongest evidence.",
    mark: "○",
    panel: "border-border bg-secondary",
    accent: "text-muted-foreground",
  },
  {
    tier: "gaps",
    heading: "Gaps",
    rule: "Not claimed; evaluate when the role actually requires it.",
    mark: "✗",
    panel: "border-warning/20 bg-warning-muted",
    accent: "text-warning",
  },
];

const Experience = () => (
  <section id="experience" aria-labelledby="experience-heading" className="scroll-mt-24 px-6 py-24">
    <div className="mx-auto max-w-4xl">
      <h2 id="experience-heading" className="mb-4 font-serif text-4xl text-foreground md:text-5xl">
        Experience
      </h2>
      <p className="mb-12 max-w-2xl text-lg text-muted-foreground">
        Open any role for the context behind it: the situation, the approach, and what I took from it.
      </p>

      <div className="space-y-6">
        {samProfile.experience.map((entry, index) => (
          <ExperienceCard key={entry.company} {...entry} index={index} />
        ))}
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {TIERS.map(({ tier, heading, rule, mark, panel, accent }) => (
          <section key={tier} aria-label={`${heading} skills`} className={`rounded-2xl border p-6 ${panel}`}>
            <h3 className={`mb-4 font-mono text-sm uppercase tracking-wider ${accent}`}>{heading}</h3>
            <p className="mb-4 text-xs text-muted-foreground">{rule}</p>
            <ul className="space-y-2">
              {samProfile.skills[tier].map((skill) => (
                <li key={skill} className="flex items-center gap-2 text-foreground">
                  <span aria-hidden="true" className={accent}>{mark}</span>
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  </section>
);

export default Experience;
