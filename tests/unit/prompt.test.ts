import { describe, expect, it } from "vitest";

import { buildTryOnPrompt } from "@/lib/generations/prompt";

describe("buildTryOnPrompt", () => {
  it("builds a deterministic four-panel try-on prompt without private identifiers", () => {
    const prompt = buildTryOnPrompt({
      outfitTitle: "Green Court Look",
      outfitItems: ["green performance top", "white shorts", "white tennis shoes"],
      identityNotes: "adult tennis player",
      privateObjectKeys: ["users/user_1/uploads/full.jpg"],
      username: "player_one",
    });

    expect(prompt).toContain("four-panel");
    expect(prompt).toContain("same person");
    expect(prompt).toContain("green performance top");
    expect(prompt).toContain("Australian hard court");
    expect(prompt).toContain("French red clay court");
    expect(prompt).toContain("Wimbledon grass court");
    expect(prompt).toContain("US night hard court");
    expect(prompt).not.toContain("player_one");
    expect(prompt).not.toContain("users/user_1/uploads/full.jpg");
  });
});
