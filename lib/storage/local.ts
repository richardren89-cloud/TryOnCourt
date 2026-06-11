import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

import type { PrivateObjectStore, SignedUpload } from "@/lib/storage/types";

export class LocalObjectStore implements PrivateObjectStore {
  constructor(private readonly rootDir = "/tmp/courtfit-uploads") {}

  async createUpload(input: {
    key: string;
    contentType: string;
    maxBytes: number;
  }): Promise<SignedUpload> {
    await mkdir(this.rootDir, { recursive: true });

    return {
      key: input.key,
      url: `file://${join(this.rootDir, input.key)}`,
      method: "PUT",
      headers: {
        "content-type": input.contentType,
        "x-max-bytes": String(input.maxBytes),
      },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
  }

  async createDownload(key: string): Promise<string> {
    return `file://${join(this.rootDir, key)}`;
  }

  async delete(key: string): Promise<void> {
    await rm(join(this.rootDir, key), { force: true });
  }
}
