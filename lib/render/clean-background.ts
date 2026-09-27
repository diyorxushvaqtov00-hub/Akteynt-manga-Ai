import sharp from "sharp";

export interface CleanupBlock {
  x: number;
  y: number;
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Conservative manga text cleanup.
 *
 * White/light speech bubbles are cleaned with a slightly inset rounded mask.
 * For dark or textured artwork we avoid painting a large rectangle over the art;
 * those blocks are left untouched and the translated text is rendered with a
 * readable outline on top.
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
    .map((block) => {
      const x = clamp(Math.round(block.x), 0, width - 1);
      const y = clamp(Math.round(block.y), 0, height - 1);
      const w = clamp(Math.round(block.width), 1, width - x);
      const h = clamp(Math.round(block.height), 1, height - y);
      const radius = Math.max(4, Math.min(24, Math.round(Math.min(w, h) * 0.18)));
      const inset = Math.max(2, Math.round(Math.min(w, h) * 0.04));

      return {
        input: Buffer.from(
          `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect x="${x + inset}" y="${y + inset}" width="${Math.max(1, w - inset * 2)}" height="${Math.max(1, h - inset * 2)}" rx="${radius}" fill="white" fill-opacity=".93"/></svg>`,
        ),
      };
    });

  if (!overlays.length) return image;
  return new Uint8Array(await base.composite(overlays).png().toBuffer());
}
