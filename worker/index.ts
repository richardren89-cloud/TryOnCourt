import { WORKER_ROLE } from "./runtime";

async function main() {
  console.log(`CourtFit ${WORKER_ROLE} bootstrap ready`);
}

void main();
