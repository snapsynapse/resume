import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { track } from "@/lib/analytics";
import { detectRoleSelection } from "@/lib/role-context";
import { hasRoleSelection } from "@/lib/role-context-client";

// One cookieless `page_viewed` event per route. It carries a single boolean: whether the
// visitor arrived through a tailored link. Which company or target the link named never
// leaves the browser; PostHog's own URL properties are stripped to the path in analytics.ts.
const PageViewTracker = () => {
  const { pathname } = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    track("page_viewed", { tailored: hasRoleSelection(detectRoleSelection()) });
  }, [pathname]);

  return null;
};

export default PageViewTracker;
