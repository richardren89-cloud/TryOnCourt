import { afterEach, describe, expect, it, vi } from "vitest";

import { getImageProvider } from "@/lib/image-provider/selected-provider";
import { VolcengineArkImageProvider } from "@/lib/image-provider/volcengine-ark";

describe("selected image provider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("selects the Volcengine Ark adapter when configured", () => {
    vi.stubEnv("IMAGE_PROVIDER", "volcengine-ark");
    vi.stubEnv("ARK_API_KEY", "test-key");

    expect(getImageProvider()).toBeInstanceOf(VolcengineArkImageProvider);
  });

  it("calls Ark Responses API with two input images and prompt text", async () => {
    const imageBytes = Uint8Array.from([137, 80, 78, 71]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          id: "resp_1",
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_image",
                  b64_json: Buffer.from(imageBytes).toString("base64"),
                },
              ],
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await new VolcengineArkImageProvider({
      apiKey: "test-key",
      endpoint: "https://ark.cn-beijing.volces.com/api/v3/responses",
      model: "doubao-seed-1-8-251228",
    }).generate({
      prompt: "生成网球试衣图",
      fullBodyImage: Uint8Array.from([1]),
      headshotImage: Uint8Array.from([2]),
    });

    expect(result).toEqual({
      providerJobId: "resp_1",
      image: imageBytes,
      mimeType: "image/png",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://ark.cn-beijing.volces.com/api/v3/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer test-key",
          "content-type": "application/json",
        }),
      }),
    );
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(requestBody).toMatchObject({
      model: "doubao-seed-1-8-251228",
      input: [
        {
          role: "user",
          content: [
            { type: "input_image" },
            { type: "input_image" },
            { type: "input_text", text: "生成网球试衣图" },
          ],
        },
      ],
    });
    expect(requestBody.input[0].content[0].image_url).toMatch(/^data:image\/jpeg;base64,/);
    expect(requestBody.input[0].content[1].image_url).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("maps provider rate limits to transient failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { code: "RateLimitExceeded" } }, 429),
      ),
    );

    await expect(
      new VolcengineArkImageProvider({ apiKey: "test-key" }).generate({
        prompt: "test",
        fullBodyImage: Uint8Array.from([1]),
        headshotImage: Uint8Array.from([2]),
      }),
    ).rejects.toMatchObject({
      failure: { kind: "TRANSIENT", code: "RateLimitExceeded" },
    });
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => body,
  } as Response;
}
