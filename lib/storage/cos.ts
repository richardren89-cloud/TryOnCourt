import type { PrivateObjectStore, SignedUpload } from "@/lib/storage/types";

export class CosObjectStore implements PrivateObjectStore {
  async createUpload(): Promise<SignedUpload> {
    throw new Error("COS REST signing is not configured yet.");
  }

  async createDownload(): Promise<string> {
    throw new Error("COS REST signing is not configured yet.");
  }

  async read(): Promise<Uint8Array> {
    throw new Error("COS object reads are not configured yet.");
  }

  async write(): Promise<void> {
    throw new Error("COS object writes are not configured yet.");
  }

  async delete(): Promise<void> {
    throw new Error("COS REST signing is not configured yet.");
  }
}
