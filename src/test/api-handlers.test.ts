// @vitest-environment node

import { describe, expect, it } from "vitest";
import chatHandler from "../../api/chat";
import analyzeFitHandler from "../../api/analyze-fit";

describe("API validation", () => {
  it("rejects non-POST chat requests", async () => {
    const res = await chatHandler(new Request("https://sam-rogers.com/api/chat", { method: "GET" }));

    expect(res.status).toBe(405);
  });

  it("rejects empty chat messages", async () => {
    const res = await chatHandler(
      new Request("https://sam-rogers.com/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [] }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "messages required" });
  });

  it("rejects short fit assessments", async () => {
    const res = await analyzeFitHandler(
      new Request("https://sam-rogers.com/api/analyze-fit", {
        method: "POST",
        body: JSON.stringify({ jobDescription: "short" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "job description required (minimum 50 chars)",
    });
  });
});
