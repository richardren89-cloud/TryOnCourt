import { createHash, createHmac } from "node:crypto";

import type { PrivateObjectStore, SignedUpload } from "@/lib/storage/types";

export class CosObjectStore implements PrivateObjectStore {
  async createUpload(input: {
    key: string;
    contentType: string;
    maxBytes: number;
  }): Promise<SignedUpload> {
    const expiresSeconds = 10 * 60;
    const expiresAt = new Date(Date.now() + expiresSeconds * 1000);

    return {
      key: input.key,
      url: this.signedUrl("PUT", input.key, expiresSeconds),
      method: "PUT",
      headers: {
        "content-type": input.contentType,
      },
      expiresAt,
    };
  }

  async createDownload(key: string, expiresSeconds: number): Promise<string> {
    return this.signedUrl("GET", key, expiresSeconds);
  }

  async read(key: string): Promise<Uint8Array> {
    const response = await fetch(this.objectUrl(key), {
      method: "GET",
      headers: this.signedHeaders("GET", key),
    });
    await assertOk(response, "read", key);

    return new Uint8Array(await response.arrayBuffer());
  }

  async write(input: { key: string; body: Uint8Array; contentType: string }): Promise<void> {
    const body = input.body.buffer.slice(
      input.body.byteOffset,
      input.body.byteOffset + input.body.byteLength,
    ) as ArrayBuffer;
    const response = await fetch(this.objectUrl(input.key), {
      method: "PUT",
      headers: {
        ...this.signedHeaders("PUT", input.key),
        "content-type": input.contentType,
      },
      body,
    });
    await assertOk(response, "write", input.key);
  }

  async delete(key: string): Promise<void> {
    const response = await fetch(this.objectUrl(key), {
      method: "DELETE",
      headers: this.signedHeaders("DELETE", key),
    });
    await assertOk(response, "delete", key);
  }

  private signedUrl(method: string, key: string, expiresSeconds: number): string {
    const url = new URL(this.objectUrl(key));
    url.searchParams.set("sign", this.authorization(method, key, expiresSeconds));
    return url.toString();
  }

  private signedHeaders(method: string, key: string): Record<string, string> {
    return {
      Authorization: this.authorization(method, key, 10 * 60),
    };
  }

  private authorization(method: string, key: string, expiresSeconds: number): string {
    const config = readConfig();
    const now = Math.floor(Date.now() / 1000);
    const signTime = `${now};${now + expiresSeconds}`;
    const path = objectPath(key);
    const headerList = "host";
    const urlParamList = "";
    const httpString = [
      method.toLowerCase(),
      path,
      urlParamList,
      `host=${config.host}`,
      "",
    ].join("\n");
    const stringToSign = [
      "sha1",
      signTime,
      sha1Hex(httpString),
      "",
    ].join("\n");
    const signKey = hmacSha1Hex(config.secretKey, signTime);
    const signature = hmacSha1Hex(signKey, stringToSign);

    return [
      "q-sign-algorithm=sha1",
      `q-ak=${config.secretId}`,
      `q-sign-time=${signTime}`,
      `q-key-time=${signTime}`,
      `q-header-list=${headerList}`,
      `q-url-param-list=${urlParamList}`,
      `q-signature=${signature}`,
    ].join("&");
  }

  private objectUrl(key: string): string {
    const config = readConfig();
    return `https://${config.host}${objectPath(key)}`;
  }
}

function readConfig(): {
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
  host: string;
} {
  const secretId = requiredEnv("COS_SECRET_ID");
  const secretKey = requiredEnv("COS_SECRET_KEY");
  const bucket = requiredEnv("COS_BUCKET");
  const region = requiredEnv("COS_REGION");
  return {
    secretId,
    secretKey,
    bucket,
    region,
    host: `${bucket}.cos.${region}.myqcloud.com`,
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for COS storage.`);
  }
  return value;
}

function objectPath(key: string): string {
  if (key.startsWith("/") || key.includes("..")) {
    throw new Error("Invalid object key.");
  }

  return `/${key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

function sha1Hex(input: string): string {
  return createHash("sha1").update(input).digest("hex");
}

function hmacSha1Hex(key: string, input: string): string {
  return createHmac("sha1", key).update(input).digest("hex");
}

async function assertOk(response: Response, action: string, key: string): Promise<void> {
  if (response.ok) {
    return;
  }

  const detail = await response.text().catch(() => "");
  throw new Error(`COS ${action} failed for ${key}: ${response.status} ${detail}`.trim());
}
