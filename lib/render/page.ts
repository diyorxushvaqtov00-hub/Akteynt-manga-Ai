import sharp from "sharp";
import type { TextBlock } from "../ai/types";
import { layoutText } from "./text-layout";
import { cleanTextRegions } from "./clean-background";

export interface RenderBlock extends TextBlock {
  translatedText: string;
}

export async function renderTranslatedPage(
  image: Uint8Array,
  blocks: RenderBlock[],
): Promise<Uint8Array> {
  const cleaned = await cleanTextRegions(image, blocks.map(({ x, y, width, height }) => ({ x, y, width, height })));
  const base = sharp(cleaned);
  const meta = await base.metadata();
  const width = meta.width ?? 1;
  const height = meta.height ?? 1;

  const overlays = blocks
    .filter((block) => block.translatedText.trim())
    .map((block) => {
      const layout = layoutText({
        text: block.translatedText,
        boxWidth: block.width,
        boxHeight: block.height,
      });

      const fontSize = layout.fontSize;
      const lineHeight = layout.lineHeight;
      const startY = block.y + Math.max(fontSize, (block.height - layout.lines.length * lineHeight) / 2 + fontSize);

      const lines = layout.lines
        .map((line, index) => {
          const escaped = escapeXml(line);
          const y = Math.round(startY + index * lineHeight);
          return `<text x="${Math.round(block.x + block.width / 2)}" y="${y}" text-anchor="middle" font-size="${fontSize}" font-family="Arial, Noto Sans, sans-serif" font-weight="700" fill="black" stroke="white" stroke-width="${Math.max(2, Math.round(fontSize / 7))}" paint-order="stroke">${escaped}</text>`;
        })
        .join("");

      return {
        input: Buffer.from(
          `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${lines}</svg>`,
        ),
      };
    });

  if (!overlays.length) return image;

  return new Uint8Array(await base.composite(overlays).png().toBuffer());
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
