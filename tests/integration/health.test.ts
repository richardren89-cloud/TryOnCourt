import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
}));
const connectionMock = vi.hoisted(() => ({
  close: vi.fn(),
}));
const amqpMock = vi.hoisted(() => ({
  connect: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ getDb: () => dbMock }));
vi.mock("amqplib", () => amqpMock);

import { GET as live } from "@/app/api/health/live/route";
import { GET as ready } from "@/app/api/health/ready/route";

describe("health endpoints", () => {
  beforeEach(() => {
    vi.stubEnv("RABBITMQ_URL", "amqp://health.test");
    dbMock.$queryRaw.mockResolvedValue([{ ok: 1 }]);
    amqpMock.connect.mockResolvedValue(connectionMock);
    connectionMock.close.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("reports liveness without dependency checks", async () => {
    const response = live();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
  });

  it("reports readiness when MySQL and RabbitMQ are available", async () => {
    const response = await ready();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "ready",
      checks: {
        database: { ok: true },
        rabbitmq: { ok: true },
      },
    });
    expect(amqpMock.connect).toHaveBeenCalledWith("amqp://health.test");
    expect(connectionMock.close).toHaveBeenCalled();
  });

  it("fails readiness when RabbitMQ is not configured", async () => {
    vi.stubEnv("RABBITMQ_URL", "");

    const response = await ready();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.checks.rabbitmq).toMatchObject({
      ok: false,
      error: "RABBITMQ_URL is not configured.",
    });
  });
});
