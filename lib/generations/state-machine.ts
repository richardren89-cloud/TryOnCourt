import type { GenerationStatus } from "@prisma/client";

const allowedTransitions: Record<GenerationStatus, readonly GenerationStatus[]> = {
  PENDING: ["PROCESSING"],
  PROCESSING: ["SUCCEEDED", "PENDING", "FAILED_REFUNDED"],
  SUCCEEDED: [],
  FAILED_REFUNDED: [],
};

export function assertGenerationTransition(
  from: GenerationStatus,
  to: GenerationStatus,
): void {
  if (!allowedTransitions[from].includes(to)) {
    throw new Error(`Invalid generation transition from ${from} to ${to}.`);
  }
}
