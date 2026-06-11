import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

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
      url: `file://${this.resolveKey(input.key)}`,
      method: "PUT",
      headers: {
        "content-type": input.contentType,
        "x-max-bytes": String(input.maxBytes),
      },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
  }

  async createDownload(key: string): Promise<string> {
    return `file://${this.resolveKey(key)}`;
  }

  async read(key: string): Promise<Uint8Array> {
    return readFile(this.resolveKey(key));
  }

  async write(input: { key: string; body: Uint8Array }): Promise<void> {
    const path = this.resolveKey(input.key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, input.body);
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolveKey(key), { force: true });
  }

  private resolveKey(key: string): string {
    const root = resolve(this.rootDir);
    const path = resolve(root, key);
    if (!path.startsWith(root + "/")) {
      throw new Error("Invalid object key.");
    }

    return path;
  }
}
