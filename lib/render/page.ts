import sharp from 'sharp';
import type { TextBlock } from '../ai/types';
import { layoutText, anchorForAlign } from './text-layout';
import { cleanPage } from './cleaning-router';
import { assertCleaningSafe, validateRenderedPage } from './visual-qa';

export interface RenderBlock extends TextBlock { translatedText: string; }
function esc(value: string) { return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;'); }

function fontFamily(category?: string, role?: string) {
  const raw = (category ?? "").toLowerCase().replace(/['"]/g, "");
  if (/times|georgia|garamond|serif|roman/.test(raw) || role === "narration") {
    return "'DejaVu Serif', Georgia, 'Times New Roman', serif";
  }
  if (/impact|anton|bebas|display|black/.test(raw) || role === "sfx" || role === "shout") {
    return "'DejaVu Sans', Impact, 'Arial Black', sans-serif";
  }
  if (/condensed|narrow/.test(raw)) {
    return "'DejaVu Sans Condensed', 'Arial Narrow', Arial, sans-serif";
  }
  if (/hand|comic|script|rounded|casual/.test(raw) || role === "thought" || role === "monologue") {
    return "'DejaVu Sans', 'Comic Sans MS', cursive";
  }
  if (/mono|typewriter/.test(raw)) {
    return "'DejaVu Sans Mono', monospace";
  }
  return "'DejaVu Sans', Arial, sans-serif";
}

function styleFontSize(style: NonNullable<TextBlock["style"]>, block: RenderBlock) {
  const ratio = Number(style.sizeRatio);
  if (Number.isFinite(ratio) && ratio > 0 && ratio < 1) {
    return Math.max(8, Math.min(96, Math.round(Math.min(block.width, block.height) * ratio)));
  }
  return style.fontSize;
}

export async function renderTranslatedPage(image: Uint8Array, blocks: RenderBlock[]): Promise<Uint8Array> {
  const cleaning = await cleanPage(image, blocks);
  if (!cleaning.safe) throw new Error('Cleaning QA: sahifa xavfsiz tozalanmadi; typesetting to‘xtatildi.');
  assertCleaningSafe(cleaning);
  const cleaned = cleaning.image;

  const base = sharp(cleaned);
  const meta = await base.metadata();
  const width = meta.width ?? 1, height = meta.height ?? 1;
  const linesSvg: string[] = [];

  for (const block of blocks) {
    const text = block.translatedText.trim(); if (!text) continue;
    const style: NonNullable<TextBlock["style"]> = block.style ?? { regionType: "unknown" };
    const role = style.visualRole ?? (style.regionType === 'sfx' ? 'sfx' : style.regionType === 'narration' || style.regionType === 'caption' ? 'narration' : 'dialogue');
    const layout = layoutText({ text, boxWidth: block.width, boxHeight: block.height, preferredFontSize: styleFontSize(style, block), direction: style.direction, role });
    const fontSize = layout.fontSize, lineHeight = layout.lineHeight;
    const align = style.align ?? 'center', anchor = anchorForAlign(align);
    const margin = Math.max(4, Math.round(Math.min(block.width, block.height) * 0.06));
    const x = align === 'left' ? block.x + margin : align === 'right' ? block.x + block.width - margin : block.x + block.width / 2;
    const totalHeight = layout.lines.length * lineHeight;
    const firstY = block.y + Math.max(fontSize, (block.height - totalHeight) / 2 + fontSize);
    const fill = style.fillColor ?? '#111111';
    const stroke = style.strokeColor ?? (fill.toLowerCase() === "#ffffff" ? "#111111" : "#ffffff");
    const strokeWidth = style.strokeWidth ?? ((role === 'sfx' || role === 'shout' || role === 'emphasis') ? Math.max(1, Math.min(7, Math.round(fontSize / 7))) : 0);
    const weight = style.fontWeight ?? (role === 'sfx' || role === 'shout' || role === 'emphasis' ? 900 : role === 'whisper' ? 400 : 700);
    const italic = style.fontStyle === 'italic' || role === 'whisper' || role === 'monologue' ? 'italic' : 'normal';
    const family = fontFamily(style.fontFamily ?? style.fontFamilyGuess, role);
    const rotate = style.rotation ?? 0;

    if (layout.direction === 'vertical') {
      const chars = [...text].slice(0,80);
      const charGap = Math.min(fontSize * 1.1, block.height / Math.max(1, chars.length));
      const start = block.y + Math.max(fontSize, (block.height - chars.length * charGap) / 2 + fontSize);
      const cx = block.x + block.width / 2;
      chars.forEach((char,index) => linesSvg.push('<text x="'+cx+'" y="'+(start+index*charGap)+'" text-anchor="middle" font-size="'+fontSize+'" font-family="'+family+'" font-weight="'+weight+'" font-style="'+italic+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+strokeWidth+'" paint-order="stroke" transform="rotate('+rotate+' '+cx+' '+(start+index*charGap)+')">'+esc(char)+'</text>'));
      continue;
    }

    layout.lines.forEach((line,index) => {
      const y = Math.round(firstY + index * lineHeight);
      const transform = rotate ? ' transform="rotate('+rotate+' '+x+' '+y+')"' : '';
      const extra = role === 'sfx' ? ' letter-spacing="'+Math.max(1,Math.round(fontSize*0.06))+'"' : '';
      linesSvg.push('<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" font-size="'+fontSize+'" font-family="'+family+'" font-weight="'+weight+'" font-style="'+italic+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+strokeWidth+'" stroke-linejoin="round" paint-order="stroke"'+extra+transform+'>'+esc(line)+'</text>');
    });
  }

  if (!linesSvg.length) return cleaned;
  const svg = Buffer.from('<svg width="'+width+'" height="'+height+'" xmlns="http://www.w3.org/2000/svg">'+linesSvg.join('')+'</svg>');
  const rendered = new Uint8Array(await base.composite([{ input: svg }]).png().toBuffer());
  const qa = await validateRenderedPage(rendered, blocks);
  if (!qa.safe) throw new Error('VISUAL_QA_FAILED: ' + qa.errors.join(' | '));
  return rendered;
}