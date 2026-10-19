import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Hero from "./Hero";
import type { PublicRoleContext } from "@/lib/role-context-client";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

const roleContextMock = vi.hoisted(() => ({
  useRoleContext: vi.fn(),
  neutralHref: () => "/",
}));

vi.mock("@/lib/role-context-client", () => roleContextMock);

const baseRoleContext: PublicRoleContext = {
  selection: { target: "content-ops" as const },
  label: "Content Operations",
  targetLabel: "Content Operations",
  heroTitles: ["First Title", "Second Title", "Third Title"],
  status: "Open to roles",
  suggestedQuestions: [],
};

function setRoleContext(roleContext: Partial<PublicRoleContext> | null) {
  roleContextMock.useRoleContext.mockReturnValue({
    selection: roleContext ? { target: "content-ops" } : {},
    roleContext: roleContext ? { ...baseRoleContext, ...roleContext } : null,
  });
}

function setReducedMotion(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe("Hero rotating title", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    setRoleContext({});
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
    vi.clearAllMocks();
  });

  it("exposes one static accessible title and no re-announcing aria-live region", () => {
    setReducedMotion(false);
    const { container } = render(<Hero onOpenChat={() => {}} />);

    // The rotating line must not sit in a live region (it re-announced every 3s before the fix).
    expect(container.querySelector("[aria-live]")).toBeNull();

    // A single static screen-reader label carries the primary title.
    const srLabel = container.querySelector(".sr-only");
    expect(srLabel).toHaveTextContent("First Title");

    // The animated span is decorative and hidden from assistive tech.
    expect(
      container.querySelector("[aria-hidden='true'].animate-fade-in"),
    ).toBeInTheDocument();
  });

  it("rotates the visible title when motion is allowed", () => {
    setReducedMotion(false);
    vi.useFakeTimers();
    render(<Hero onOpenChat={() => {}} />);

    expect(screen.queryByText("Second Title")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText("Second Title")).toBeInTheDocument();
  });

  it("holds the applied-for title still when an application link supplies one title", () => {
    setReducedMotion(false);
    vi.useFakeTimers();
    setRoleContext({ heroTitles: ["Applied Role Title"], sourceRole: "Applied Role Title" });
    render(<Hero onOpenChat={() => {}} />);

    act(() => {
      vi.advanceTimersByTime(9000);
    });

    expect(screen.getAllByText("Applied Role Title").length).toBeGreaterThan(0);
    expect(screen.queryByText("First Title")).not.toBeInTheDocument();
  });

  it("holds on the primary title when prefers-reduced-motion is set", () => {
    setReducedMotion(true);
    vi.useFakeTimers();
    render(<Hero onOpenChat={() => {}} />);

    act(() => {
      vi.advanceTimersByTime(9000);
    });

    expect(screen.queryByText("Second Title")).not.toBeInTheDocument();
    expect(screen.queryByText("Third Title")).not.toBeInTheDocument();
  });

  it("shows the stable positioning promise and three compact evidence points", () => {
    setReducedMotion(true);
    render(<Hero onOpenChat={() => {}} />);

    expect(
      screen.getByText(/turn complex products into measurable human capability/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Selected evidence" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("10x reach")).toBeInTheDocument();
    expect(screen.getByText("90% simpler · 40% faster")).toBeInTheDocument();
    expect(screen.getByText("80% adoption in 30 days")).toBeInTheDocument();
    expect(screen.getByText("Governed multi-model practice")).toBeInTheDocument();
  });

  it("shows the tailored-link notice when a role selection is active", () => {
    setReducedMotion(true);
    setRoleContext({ companyLabel: "ExampleCorp", label: "ExampleCorp - Content Operations" });
    render(<Hero onOpenChat={() => {}} />);

    const notice = screen.getByRole("complementary", { name: "Page context" });
    expect(notice).toHaveTextContent(
      "Tailored view for ExampleCorp reviewers. Nothing about this link is stored or tracked.",
    );
    expect(screen.getByRole("link", { name: "View the neutral version" })).toHaveAttribute("href", "/");
  });

  it("omits the notice and uses profile titles when no selection is active", () => {
    setReducedMotion(true);
    setRoleContext(null);
    render(<Hero onOpenChat={() => {}} />);

    expect(screen.queryByRole("complementary", { name: "Page context" })).not.toBeInTheDocument();
    expect(screen.queryByText("First Title")).not.toBeInTheDocument();
  });
});
