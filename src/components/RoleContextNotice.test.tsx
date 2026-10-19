import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import RoleContextNotice from "./RoleContextNotice";
import type { PublicRoleContext } from "@/lib/role-context-client";

const baseContext: PublicRoleContext = {
  selection: { target: "content-ops" },
  label: "ExampleCorp - Content Operations",
  targetLabel: "Content Operations",
  companyLabel: "ExampleCorp",
  suggestedQuestions: ["Is Sam a fit?"],
};

describe("RoleContextNotice", () => {
  afterEach(() => {
    cleanup();
    window.history.pushState({}, "", "/");
  });

  it("renders the tailored-view copy with the company label and a neutral link without the search string", () => {
    window.history.pushState({}, "", "/?for=examplecorp&target=content-ops#about");

    render(<RoleContextNotice roleContext={baseContext} />);

    const aside = screen.getByRole("complementary", { name: "Page context" });
    expect(aside).toHaveTextContent(
      "Tailored view for ExampleCorp reviewers. The company and role this link names are never stored or sent to analytics.",
    );
    const link = screen.getByRole("link", { name: "View the neutral version" });
    expect(link).toHaveAttribute("href", "/");
    expect(link.getAttribute("href")).not.toContain("?");
    expect(link.getAttribute("href")).not.toContain("#");
  });

  it("falls back to the target label when no company label is known", () => {
    render(
      <RoleContextNotice roleContext={{ ...baseContext, companyLabel: undefined, label: "Content Operations" }} />,
    );

    expect(screen.getByRole("complementary", { name: "Page context" })).toHaveTextContent(
      "Tailored view for Content Operations reviewers.",
    );
  });

  it("renders nothing when no selection is active", () => {
    const { container } = render(<RoleContextNotice roleContext={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
