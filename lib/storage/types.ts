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
  delete(key: string): Promise<void>;
}
