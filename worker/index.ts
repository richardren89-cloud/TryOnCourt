import { WORKER_ROLE } from "./runtime";
import { startGenerationWorker } from "./polling";

async function main() {
  console.log(`CourtFit ${WORKER_ROLE} bootstrap ready`);
  await startGenerationWorker();
}

void main();
