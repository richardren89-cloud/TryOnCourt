import type { PrivateObjectStore, SignedUpload } from "@/lib/storage/types";

export class CosObjectStore implements PrivateObjectStore {
  async createUpload(): Promise<SignedUpload> {
    throw new Error("COS REST signing is not configured yet.");
  }

  async createDownload(): Promise<string> {
    throw new Error("COS REST signing is not configured yet.");
  }

  async delete(): Promise<void> {
    throw new Error("COS REST signing is not configured yet.");
  }
}
