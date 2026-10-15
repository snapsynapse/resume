import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DecisionBriefSidebar from "./DecisionBriefSidebar";
import Header from "./Header";

const analyticsMock = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("@/lib/analytics", () => analyticsMock);

const localStorageMock = (() => {
  const store = new Map<string, string>();
  return {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  };
})();
Object.defineProperty(window, "localStorage", { configurable: true, value: localStorageMock });

describe("Interview Decision Brief keyboard controls", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it.each([
    ["Enter", "{Enter}"],
    ["Space", " "],
  ])("reaches desktop Copy all by Tab and activates it with %s", async (_name, key) => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    render(<DecisionBriefSidebar fitResult={null} hasJobDescription={false} />);

    for (const name of [
      "Collapse Interview Decision Brief",
      "Recruiter",
      "Hiring Manager",
      "Copy all Interview Decision Brief blocks",
    ]) {
      await user.tab();
      expect(screen.getByRole("button", { name })).toHaveFocus();
    }

    const copyAll = screen.getByRole("button", { name: "Copy all Interview Decision Brief blocks" });
    await user.keyboard(key);
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Recruiter Summary"));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Interview Probes"));
    expect(copyAll).toHaveFocus();
    expect(analyticsMock.track).toHaveBeenCalledWith("decision_brief_copied", {
      block: "copy-all", mode: "recruiter", fitVerdict: undefined,
    });
  });

  it("tabs to the first block, toggles with Space and Enter, and copies without losing focus", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    render(<DecisionBriefSidebar fitResult={null} hasJobDescription={false} />);

    for (let step = 0; step < 5; step += 1) await user.tab();
    const toggle = screen.getByRole("button", { name: "Recruiter Summary" });
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(writeText).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(writeText).not.toHaveBeenCalled();

    await user.tab();
    const copy = screen.getByRole("button", { name: "Copy recruiter summary" });
    expect(copy).toHaveFocus();
    await user.keyboard(" ");
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Recruiter Summary"));
    expect(copy).toHaveFocus();
    await user.tab({ shift: true });
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  async function openMobileBrief() {
    const user = userEvent.setup();
    render(
      <>
        {/* JSDOM does not load Tailwind media rules. Model the mobile hidden
            surfaces while keeping the real Header and dialog focus behavior. */}
        <style>{".hidden { display: none; }"}</style>
        <Header />
        <DecisionBriefSidebar fitResult={null} hasJobDescription={false} />
      </>,
    );
    await user.tab();
    expect(screen.getByRole("link", { name: "Sam Rogers - main site" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Open navigation menu" })).toHaveFocus();
    await user.keyboard("{Enter}");
    for (let step = 0; step < 4; step += 1) await user.tab();
    expect(screen.getByRole("button", { name: "Interview brief" })).toHaveFocus();
    await user.keyboard("{Enter}");
    const dialog = await screen.findByRole("dialog", { name: "Interview Decision Brief" });
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Close Interview Decision Brief" })).toHaveFocus());
    return { user, dialog };
  }

  it("contains forward and reverse Tab focus in the mobile dialog and closes on Escape", async () => {
    const { user, dialog } = await openMobileBrief();
    const close = within(dialog).getByRole("button", { name: "Close Interview Decision Brief" });
    const lastCopy = within(dialog).getByRole("button", { name: "Copy interview probes" });

    await user.tab({ shift: true });
    expect(lastCopy).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    for (let step = 0; step < 18; step += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it.each([
    ["Escape", "{Escape}"],
    ["activating the close button", "{Enter}"],
  ])("restores mobile focus to the navigation menu button after %s", async (_name, key) => {
    const { user } = await openMobileBrief();
    await user.keyboard(key);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Open navigation menu" })).toHaveFocus());
  });
});
