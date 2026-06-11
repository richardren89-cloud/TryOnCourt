const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function assertSafeImageUpload(input: { contentType: string; byteSize: number }): void {
  if (!allowedImageTypes.has(input.contentType)) {
    throw new Error("Unsupported image type.");
  }

  if (input.byteSize <= 0) {
    throw new Error("Image must be at least 1 byte.");
  }

  if (input.byteSize > 8 * 1024 * 1024) {
    throw new Error("Image is too large.");
  }
}

export function redactForLog(value: string): string {
  if (value.length <= 8) {
    return "[redacted]";
  }

  return `${value.slice(0, 4)}...[redacted]`;
}
