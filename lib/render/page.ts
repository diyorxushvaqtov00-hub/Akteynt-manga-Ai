import sharp from "sharp";
import type { TextBlock } from "../ai/types";
import { layoutText, anchorForAlign } from "./text-layout";
import { cleanTextRegions } from "./clean-background";

export interface RenderBlock extends TextBlock {
  translatedText: string;
}

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function fontFamily(category?: string) {
  switch ((category ?? "sans").toLowerCase()) {
    case "serif": return "Georgia, 'Times New Roman', serif";
    case "handwritten": return "'Comic Sans MS', 'Trebuchet MS', cursive";
    case "display": return "'Arial Black', Impact, sans-serif";
    case "condensed": return "'Arial Narrow', Arial, sans-serif";
    default: return "Arial, 'Noto Sans', sans-serif";
  }
}

export async function renderTranslatedPage(
  image: Uint8Array,
  blocks: RenderBlock[],
): Promise<Uint8Array> {
  const cleaned = await cleanTextRegions(image, blocks);
  const base = sharp(cleaned);
  const meta = await base.metadata();
  const width = meta.width ?? 1;
  const height = meta.height ?? 1;

  const linesSvg: string[] = [];

  for (const block of blocks) {
    const text = block.translatedText.trim();
    if (!text) continue;

    const style = block.style ?? {};
    const layout = layoutText({
      text,
      boxWidth: block.width,
      boxHeight: block.height,
      preferredFontSize: style.fontSize,
      direction: style.direction,
    });

    const fontSize = layout.fontSize;
    const lineHeight = layout.lineHeight;
    const align = style.align ?? "center";
    const anchor = anchorForAlign(align);
    const x = align === "left"
      ? block.x + Math.max(3, block.width * 0.06)
      : align === "right"
        ? block.x + block.width - Math.max(3, block.width * 0.06)
        : block.x + block.width / 2;

    const totalHeight = layout.lines.length * lineHeight;
    const firstY = block.y + Math.max(fontSize, (block.height - totalHeight) / 2 + fontSize);
    const fill = style.fillColor ?? "#111111";
    const stroke = style.strokeColor ?? (fill.toLowerCase() === "#ffffff" ? "#111111" : "#ffffff");
    const strokeWidth = style.strokeWidth ?? Math.max(0, Math.min(8, Math.round(fontSize / 8)));
    const weight = style.fontWeight ?? 700;
    const italic = style.fontStyle === "italic" ? "italic" : "normal";
    const family = fontFamily(style.fontFamily);
    const rotate = style.rotation ?? 0;
    const regionType = style.regionType ?? "unknown";

    if (layout.direction === "vertical") {
      const chars = [...text].slice(0, 80);
      const charGap = Math.min(fontSize * 1.1, block.height / Math.max(1, chars.length));
      const start = block.y + Math.max(fontSize, (block.height - chars.length * charGap) / 2 + fontSize);
      const cx = block.x + block.width / 2;
      chars.forEach((char, index) => {
        linesSvg.push(
          `<text x="${cx}" y="${start + index * charGap}" text-anchor="middle" font-size="${fontSize}" font-family="${family}" font-weight="${weight}" font-style="${italic}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" paint-order="stroke" transform="rotate(${rotate} ${cx} ${start + index * charGap})">${esc(char)}</text>`,
        );
      });
      continue;
    }

    layout.lines.forEach((line, index) => {
      const y = Math.round(firstY + index * lineHeight);
      const tx = x;
      const ty = y;
      const transform = rotate ? ` transform="rotate(${rotate} ${tx} ${ty})"` : "";
      const extra = regionType === "sfx" ? ` letter-spacing="${Math.max(0, Math.round(fontSize * 0.04))}"` : "";
      linesSvg.push(
        `<text x="${tx}" y="${ty}" text-anchor="${anchor}" font-size="${fontSize}" font-family="${family}" font-weight="${weight}" font-style="${italic}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" paint-order="stroke"${extra}${transform}>${esc(line)}</text>`,
      );
    });
  }

  if (!linesSvg.length) return image;

  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${linesSvg.join("")}</svg>`,
  );

  return new Uint8Array(await base.composite([{ input: svg }]).png().toBuffer());
}