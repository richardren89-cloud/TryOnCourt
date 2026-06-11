import { MockImageProvider } from "@/lib/image-provider/mock";
import type { ImageProvider } from "@/lib/image-provider/types";
import { VolcengineArkImageProvider } from "@/lib/image-provider/volcengine-ark";

export function getImageProvider(): ImageProvider {
  if (process.env.IMAGE_PROVIDER === "volcengine-ark" || process.env.IMAGE_PROVIDER === "ark") {
    return new VolcengineArkImageProvider();
  }

  return new MockImageProvider();
}
