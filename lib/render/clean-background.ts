import sharp from "sharp";
import type { TextBlock } from "../ai/types";

export interface CleanupBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  style?: TextBlock["style"];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isLight(hex: string) {
  const n = hex.replace("#", "");
  if (n.length !== 6) return true;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 170;
}

/**
 * Remove original text conservatively.
 *
 * We only paint over regions when the vision engine says the background is
 * a simple solid bubble/caption. Complex artwork is deliberately left intact;
 * the renderer then uses a high-contrast outline instead of destroying artwork.
 */
export async function cleanTextRegions(
  image: Uint8Array,
  blocks: CleanupBlock[],
): Promise<Uint8Array> {
  const base = sharp(image);
  const meta = await base.metadata();
  const width = meta.width ?? 1;
  const height = meta.height ?? 1;

  const overlays = blocks
    .filter((block) => {
      const style = block.style;
      if (!style) return false;
      if (style.backgroundMode !== "solid") return false;
      return ["speech", "thought", "narration", "caption"].includes(style.regionType ?? "");
    })
    .map((block) => {
      const x = clamp(Math.round(block.x), 0, width - 1);
      const y = clamp(Math.round(block.y), 0, height - 1);
      const w = clamp(Math.round(block.width), 1, width - x);
      const h = clamp(Math.round(block.height), 1, height - y);
      const radius = Math.max(3, Math.min(40, Math.round(Math.min(w, h) * 0.16)));
      const inset = Math.max(2, Math.round(Math.min(w, h) * 0.035));
      const bg = block.style?.backgroundColor ?? (isLight("#ffffff") ? "#ffffff" : "#000000");
      const shape = block.style?.bubbleShape ?? "rectangle";

      const rect = shape === "ellipse"
        ? `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${Math.max(1, w / 2 - inset)}" ry="${Math.max(1, h / 2 - inset)}" fill="${bg}"/>`
        : `<rect x="${x + inset}" y="${y + inset}" width="${Math.max(1, w - inset * 2)}" height="${Math.max(1, h - inset * 2)}" rx="${radius}" fill="${bg}"/>`;

      return {
        input: Buffer.from(
          `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${rect}</svg>`,
        ),
      };
    });

  if (!overlays.length) return image;
  return new Uint8Array(await base.composite(overlays).png().toBuffer());
}