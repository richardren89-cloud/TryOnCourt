import { MockImageProvider } from "@/lib/image-provider/mock";
import type { ImageProvider } from "@/lib/image-provider/types";

export function getImageProvider(): ImageProvider {
  return new MockImageProvider();
}
