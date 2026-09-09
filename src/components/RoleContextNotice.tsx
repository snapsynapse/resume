import { neutralHref } from "@/lib/role-context-client";
import type { PublicRoleContext } from "@/lib/role-context-client";

interface RoleContextNoticeProps {
  roleContext: PublicRoleContext | null;
  className?: string;
}

// A quiet, non-dismissible note that tells a reader arriving from a tailored link what
// the link does and, just as importantly, what it does not do. Nothing here holds state
// and nothing about the link is stored or reported anywhere.
const RoleContextNotice = ({ roleContext, className }: RoleContextNoticeProps) => {
  const audience = roleContext?.companyLabel ?? roleContext?.targetLabel;
  if (!roleContext || !audience) return null;

  return (
    <aside
      aria-label="Page context"
      className={["text-sm text-muted-foreground", className].filter(Boolean).join(" ")}
    >
      <p>
        Tailored view for {audience} reviewers. Nothing about this link is stored or tracked.{" "}
        <a
          href={neutralHref()}
          className="underline underline-offset-4 decoration-border hover:text-foreground hover:decoration-foreground transition-colors"
        >
          View the neutral version
        </a>
      </p>
    </aside>
  );
};

export default RoleContextNotice;
