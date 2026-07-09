import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Hero from "./Hero";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("@/lib/role-context", () => ({
  composeRoleContext: () => ({
    heroTitles: ["First Title", "Second Title", "Third Title"],
    status: "Open to roles",
  }),
  detectRoleSelection: () => ({}),
}));

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
});
