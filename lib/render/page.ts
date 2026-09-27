import sharp from "sharp";
import type { TextBlock } from "../ai/types";
import { layoutText } from "./text-layout";

export interface RenderBlock extends TextBlock {
  translatedText: string;
}

export async function renderTranslatedPage(
  image: Uint8Array,
  blocks: RenderBlock[],
): Promise<Uint8Array> {
  const base = sharp(image);
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

      const lines = layout.lines
        .map((line) => escapeXml(line))
        .map(
          (line, index) =>
            \`<text x="\${block.x + block.width / 2}" y="\${block.y + 16 + index * layout.lineHeight}" text-anchor="middle" font-size="\${layout.fontSize}" font-family="Arial, sans-serif" font-weight="700" fill="black" stroke="white" stroke-width="3" paint-order="stroke">\${line}</text>\`,
        )
        .join("");

      return {
        input: Buffer.from(
          \`<svg width="\${width}" height="\${height}" xmlns="http://www.w3.org/2000/svg">\${lines}</svg>\`,
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
