import {
  ImageProviderError,
  type ImageProvider,
  type TryOnRequest,
  type TryOnResult,
} from "@/lib/image-provider/types";

const defaultEndpoint = "https://ark.cn-beijing.volces.com/api/v3/responses";
const defaultModel = "doubao-seed-1-8-251228";

export interface VolcengineArkConfig {
  apiKey?: string;
  endpoint?: string;
  model?: string;
}

export class VolcengineArkImageProvider implements ImageProvider {
  private readonly apiKey: string | undefined;
  private readonly endpoint: string;
  private readonly model: string;

  constructor(config: VolcengineArkConfig = {}) {
    this.apiKey = config.apiKey ?? process.env.ARK_API_KEY;
    this.endpoint = config.endpoint ?? process.env.ARK_RESPONSES_ENDPOINT ?? defaultEndpoint;
    this.model = config.model ?? process.env.ARK_MODEL ?? defaultModel;
  }

  async generate(input: TryOnRequest): Promise<TryOnResult> {
    if (!this.apiKey) {
      throw new ImageProviderError({
        kind: "PERMANENT",
        code: "ARK_API_KEY_MISSING",
      });
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_image",
                image_url: toDataUrl(input.fullBodyImage),
              },
              {
                type: "input_image",
                image_url: toDataUrl(input.headshotImage),
              },
              {
                type: "input_text",
                text: input.prompt,
              },
            ],
          },
        ],
      }),
    });

    const body = await safeJson(response);
    if (!response.ok) {
      throw new ImageProviderError(classifyArkStatus(response.status, body));
    }

    const output = extractImageOutput(body);
    if (!output) {
      throw new ImageProviderError({
        kind: "PERMANENT",
        code: "ARK_NO_IMAGE_OUTPUT",
      });
    }

    if (output.kind === "base64") {
      return {
        providerJobId: extractResponseId(body),
        image: Uint8Array.from(Buffer.from(output.value, "base64")),
        mimeType: output.mimeType,
      };
    }

    const imageResponse = await fetch(output.value);
    if (!imageResponse.ok) {
      throw new ImageProviderError({
        kind: "TRANSIENT",
        code: "ARK_IMAGE_DOWNLOAD_FAILED",
      });
    }
    const contentType = imageResponse.headers.get("content-type") ?? "";
    const bytes = new Uint8Array(await imageResponse.arrayBuffer());

    return {
      providerJobId: extractResponseId(body),
      image: bytes,
      mimeType: contentType.includes("jpeg") ? "image/jpeg" : "image/png",
    };
  }
}

type ExtractedImage =
  | { kind: "url"; value: string }
  | { kind: "base64"; value: string; mimeType: "image/png" | "image/jpeg" };

function toDataUrl(bytes: Uint8Array): string {
  return `data:image/jpeg;base64,${Buffer.from(bytes).toString("base64")}`;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function classifyArkStatus(status: number, body: unknown) {
  const code = extractErrorCode(body);
  if (status === 429 || status >= 500) {
    return { kind: "TRANSIENT" as const, code: code ?? "ARK_PROVIDER_UNAVAILABLE" };
  }
  if (status === 400 || status === 403) {
    return { kind: "SAFETY_REJECTED" as const, code: code ?? "ARK_REQUEST_REJECTED" };
  }

  return { kind: "PERMANENT" as const, code: code ?? "ARK_REQUEST_FAILED" };
}

function extractErrorCode(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const record = body as Record<string, unknown>;
  const error = record.error;
  if (error && typeof error === "object") {
    const code = (error as Record<string, unknown>).code;
    return typeof code === "string" ? code : null;
  }

  return null;
}

function extractResponseId(body: unknown): string | undefined {
  if (body && typeof body === "object") {
    const id = (body as Record<string, unknown>).id;
    return typeof id === "string" ? id : undefined;
  }

  return undefined;
}

function extractImageOutput(body: unknown): ExtractedImage | null {
  return walkForImage(body, new Set());
}

function walkForImage(value: unknown, seen: Set<unknown>): ExtractedImage | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  if (seen.has(value)) {
    return null;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = walkForImage(item, seen);
      if (found) {
        return found;
      }
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  const type = typeof record.type === "string" ? record.type : "";
  const url = stringValue(record.image_url) ?? stringValue(record.url);
  if (url && type !== "input_image") {
    return { kind: "url", value: url };
  }

  const base64 = stringValue(record.b64_json) ?? stringValue(record.image_base64);
  if (base64) {
    return {
      kind: "base64",
      value: stripBase64Prefix(base64),
      mimeType: base64.includes("image/jpeg") ? "image/jpeg" : "image/png",
    };
  }

  for (const child of Object.values(record)) {
    const found = walkForImage(child, seen);
    if (found) {
      return found;
    }
  }

  return null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function stripBase64Prefix(value: string): string {
  const commaIndex = value.indexOf(",");
  return value.startsWith("data:") && commaIndex >= 0 ? value.slice(commaIndex + 1) : value;
}
