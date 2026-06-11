export interface TryOnRequest {
  prompt: string;
  fullBodyImage: Uint8Array;
  headshotImage: Uint8Array;
}

export interface TryOnResult {
  providerJobId?: string;
  image: Uint8Array;
  mimeType: "image/png" | "image/jpeg";
}

export interface ImageProvider {
  generate(input: TryOnRequest): Promise<TryOnResult>;
}

export type ProviderFailure =
  | { kind: "TRANSIENT"; code: string }
  | { kind: "PERMANENT"; code: string }
  | { kind: "SAFETY_REJECTED"; code: string };
