import { ArrowUpRight, Gauge } from "lucide-react";
import { samProfile } from "@/data/sam-profile";
import { track } from "@/lib/analytics";

// Static evidence card for Sam's public AI token-usage dashboard.
//
// Deliberately static: the numbers are floor values carried in sam-profile.ts with an explicit
// as-of date. There is no fetch and no iframe here — the two sites stay decoupled, and nothing
// on this page can go stale in a way a reviewer cannot see.
const AIUsageCard = () => {
  const usage = samProfile.aiUsageDashboard;

  const stats = [
    { value: usage.totalTokensShort, label: "tokens metered" },
    { value: String(usage.sourceCount), label: "providers and tools" },
    { value: "Since 2023", label: "continuous record" },
  ];

  return (
    <section
      id="ai-usage"
      aria-labelledby="ai-usage-heading"
      className="scroll-mt-24 px-6 pb-8"
    >
      <div className="mx-auto max-w-4xl">
        <article className="rounded-2xl border border-border bg-card p-6 transition-colors duration-300 hover:border-accent/50 md:p-8">
          <div className="mb-4 flex items-start gap-3">
            <Gauge className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Self-metered AI usage
              </p>
              <h2
                id="ai-usage-heading"
                className="mt-1 font-serif text-2xl text-foreground md:text-3xl"
              >
                I meter my own AI usage and publish it
              </h2>
            </div>
          </div>

          <ul
            aria-label="AI usage dashboard headline figures"
            className="mb-5 grid gap-3 sm:grid-cols-3"
          >
            {stats.map((stat) => (
              <li key={stat.label} className="border-l-2 border-accent/60 pl-3">
                <span className="block text-xl font-semibold text-foreground">
                  {stat.value}
                </span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </li>
            ))}
          </ul>

          <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A published record of every AI provider and tool I work with, kept as a
            recovered record rather than a complete history: gaps are labeled unknown,
            never counted as zero. Figures are floor values as of {usage.asOf}.
          </p>

          <a
            href={usage.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track("ai_usage_dashboard_clicked", { source: "evidence_card" }, { immediate: true })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent"
          >
            <span>View the usage dashboard</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </article>
      </div>
    </section>
  );
};

export default AIUsageCard;
