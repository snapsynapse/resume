import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import PageViewTracker from "./PageViewTracker";
import { track } from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

function visit(search: string) {
  window.history.replaceState(null, "", `/${search}`);
  render(
    <MemoryRouter initialEntries={["/"]}>
      <PageViewTracker />
    </MemoryRouter>,
  );
}

describe("PageViewTracker", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("records one page view with tailored false on the neutral page", () => {
    visit("");
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("page_viewed", { tailored: false });
  });

  it("records only a tailored boolean for a tailored link, never the company or target", () => {
    visit("?company=examplecorp&target=content-ops");
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("page_viewed", { tailored: true });
    expect(JSON.stringify(vi.mocked(track).mock.calls)).not.toMatch(/examplecorp|content-ops/);
  });
});
