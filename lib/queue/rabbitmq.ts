import type { QueuePublisher } from "@/lib/queue/types";

export class RabbitMqPublisher implements QueuePublisher {
  async publish(): Promise<void> {
    throw new Error("RabbitMQ publisher is configured in the worker task.");
  }
}
