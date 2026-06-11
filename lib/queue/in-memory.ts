import type { QueuePublisher } from "@/lib/queue/types";

export class InMemoryQueuePublisher implements QueuePublisher {
  readonly messages: Array<{ topic: string; payload: unknown }> = [];

  async publish(topic: string, payload: unknown): Promise<void> {
    this.messages.push({ topic, payload });
  }
}
