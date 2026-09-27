import type { TextBlock, VisionPageResult } from "./types";

export interface VisionProvider {
  detectText(image: Uint8Array): Promise<VisionPageResult>;
  translate(text: string, context?: string): Promise<string>;
}

export function getVisionProvider(): VisionProvider {
  throw new Error(
    "AI provider hali sozlanmagan. AI Gateway/provider environment o'zgaruvchilarini ulang.",
  );
}

export function assertVisionResult(result: VisionPageResult) {
  if (!Number.isFinite(result.pageWidth) || !Number.isFinite(result.pageHeight)) {
    throw new Error("Vision natijasida sahifa o'lchami noto'g'ri.");
  }

  if (!Array.isArray(result.blocks)) {
    throw new Error("Vision natijasida blocks massivi topilmadi.");
  }

  for (const block of result.blocks as TextBlock[]) {
    if (!block.id || typeof block.text !== "string") throw new Error("Vision text block noto'g'ri.");
    if (![block.x, block.y, block.width, block.height].every(Number.isFinite)) {
      throw new Error("Vision koordinatalari noto'g'ri.");
    }
  }
}
