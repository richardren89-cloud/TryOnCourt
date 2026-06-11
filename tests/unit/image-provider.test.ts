import { describe, expect, it } from "vitest";

import { MockImageProvider } from "@/lib/image-provider/mock";

describe("MockImageProvider", () => {
  it("returns deterministic image bytes", async () => {
    const result = await new MockImageProvider().generate({
      prompt: "test prompt",
      fullBodyImage: new Uint8Array([1]),
      headshotImage: new Uint8Array([2]),
    });

    expect(result.mimeType).toBe("image/png");
    expect(result.image.length).toBeGreaterThan(0);
  });
});
