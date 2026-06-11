import { CosObjectStore } from "@/lib/storage/cos";
import { LocalObjectStore } from "@/lib/storage/local";
import type { PrivateObjectStore } from "@/lib/storage/types";

export function getObjectStore(): PrivateObjectStore {
  if (process.env.STORAGE_DRIVER === "cos") {
    return new CosObjectStore();
  }

  return new LocalObjectStore(process.env.LOCAL_UPLOAD_DIR);
}
