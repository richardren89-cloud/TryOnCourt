import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GenerationForm } from "@/components/try-on/generation-form";

const outfit = {
  id: "outfit_1",
  title: "Paris Match Outfit",
  items: [{ id: "item_1", category: "TOP", displayName: "Green performance top" }],
};

describe("GenerationForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("enables generation only after both uploads complete and submits with an idempotency key", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/uploads/sign") {
        const body = JSON.parse(String(init?.body)) as { kind: string };
        return jsonResponse({
          upload: {
            key: `uploads/${body.kind}.jpg`,
            url: `file:///tmp/${body.kind}.jpg`,
            method: "PUT",
            headers: {},
          },
        });
      }
      if (url === "/api/uploads/complete") {
        const body = JSON.parse(String(init?.body)) as { kind: string };
        return jsonResponse({ photo: { id: `${body.kind.toLowerCase()}_photo` } }, 201);
      }
      if (url === "/api/generations") {
        return jsonResponse({ job: { id: "job_1" } }, 201);
      }
      if (url === "/api/generations/job_1") {
        return jsonResponse({
          job: { id: "job_1", status: "PENDING", failureCode: null, asset: null },
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(crypto, "randomUUID").mockReturnValue("request_1" as `${string}-${string}-${string}-${string}-${string}`);

    render(<GenerationForm outfit={outfit} balance={5} />);

    const submit = screen.getByRole("button", { name: "生成四大满贯试穿图" });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByTestId("full-body-input"), {
      target: { files: [new File(["full"], "full.jpg", { type: "image/jpeg" })] },
    });
    await screen.findByText("已上传：full.jpg");
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByTestId("headshot-input"), {
      target: { files: [new File(["head"], "head.jpg", { type: "image/jpeg" })] },
    });
    await screen.findByText("已上传：head.jpg");
    expect(submit).toBeEnabled();

    fireEvent.click(submit);
    await screen.findByText("正在读取生成状态...");

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/generations",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "idempotency-key": "request_1",
          }),
        }),
      );
    });
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}
