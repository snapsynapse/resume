import { samProfile } from "@/data/sam-profile";
import ExperienceCard from "./ExperienceCard";

const Experience = () => {
  return (
    <section id="experience" aria-labelledby="experience-heading" className="scroll-mt-24 py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="mb-12">
          <h2 id="experience-heading" className="text-4xl md:text-5xl font-serif text-foreground mb-4">
            Experience
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Each role includes queryable AI context—the real story behind the bullet points.
          </p>
        </div>

        {/* Experience cards */}
        <div className="space-y-6">
          {samProfile.experience.map((exp, index) => (
            <ExperienceCard
              key={exp.company}
              {...exp}
              index={index}
            />
          ))}
        </div>

        {/* Skills Grid */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-success-muted border border-success/20 rounded-2xl">
            <h3 className="text-sm font-mono uppercase tracking-wider text-success mb-4">
              Strong
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Repeated, shipped, or quantified evidence.
            </p>
            <ul className="space-y-2">
              {samProfile.skills.strong.map((skill) => (
                <li key={skill} className="text-foreground flex items-center gap-2">
                  <span className="text-success">✓</span>
                  {skill}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 bg-secondary border border-border rounded-2xl">
            <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">
              Moderate
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Real exposure; less depth or scale than the strongest evidence.
            </p>
            <ul className="space-y-2">
              {samProfile.skills.moderate.map((skill) => (
                <li key={skill} className="text-foreground flex items-center gap-2">
                  <span className="text-muted-foreground">○</span>
                  {skill}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 bg-warning-muted border border-warning/20 rounded-2xl">
            <h3 className="text-sm font-mono uppercase tracking-wider text-warning mb-4">
              Gaps (I'll tell you)
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Not claimed; evaluate when the role actually requires it.
            </p>
            <ul className="space-y-2">
              {samProfile.skills.gaps.map((skill) => (
                <li key={skill} className="text-foreground flex items-center gap-2">
                  <span className="text-warning">✗</span>
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
