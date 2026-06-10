import { describe, expect, it } from "vitest";

import { WORKER_ROLE } from "../../worker/runtime";

describe("worker runtime", () => {
  it("identifies the generation worker process", () => {
    expect(WORKER_ROLE).toBe("generation-worker");
  });
});
