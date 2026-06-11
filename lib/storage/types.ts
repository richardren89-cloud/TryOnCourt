export interface SignedUpload {
  key: string;
  url: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: Date;
}

export interface PrivateObjectStore {
  createUpload(input: {
    key: string;
    contentType: string;
    maxBytes: number;
  }): Promise<SignedUpload>;
  createDownload(key: string, expiresSeconds: number): Promise<string>;
  read(key: string): Promise<Uint8Array>;
  write(input: { key: string; body: Uint8Array; contentType: string }): Promise<void>;
  delete(key: string): Promise<void>;
}
