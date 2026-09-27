import sharp from "sharp";

export interface CleanupBlock {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function cleanTextRegions(
  image: Uint8Array,
  blocks: CleanupBlock[],
): Promise<Uint8Array> {
  const base = sharp(image);
  const meta = await base.metadata();
  const width = meta.width ?? 1;
  const height = meta.height ?? 1;

  const overlays = blocks.map((block) => ({
    input: Buffer.from(
      \`<svg width="\${width}" height="\${height}" xmlns="http://www.w3.org/2000/svg"><rect x="\${Math.max(0, block.x)}" y="\${Math.max(0, block.y)}" width="\${Math.max(1, block.width)}" height="\${Math.max(1, block.height)}" rx="\${Math.min(block.width, block.height) / 2}" fill="white" fill-opacity=".96"/></svg>\`,
    ),
  }));

  if (!overlays.length) return image;
  return new Uint8Array(await base.composite(overlays).png().toBuffer());
}
