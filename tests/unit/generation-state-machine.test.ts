import { describe, expect, it } from "vitest";

import { assertGenerationTransition } from "@/lib/generations/state-machine";

describe("generation state machine", () => {
  it("allows the expected generation transitions", () => {
    expect(() => assertGenerationTransition("PENDING", "PROCESSING")).not.toThrow();
    expect(() => assertGenerationTransition("PROCESSING", "SUCCEEDED")).not.toThrow();
    expect(() => assertGenerationTransition("PROCESSING", "FAILED_REFUNDED")).not.toThrow();
    expect(() => assertGenerationTransition("PROCESSING", "PENDING")).not.toThrow();
  });

  it("rejects final-state transitions", () => {
    expect(() => assertGenerationTransition("SUCCEEDED", "PENDING")).toThrow(
      "Invalid generation transition",
    );
  });
});
