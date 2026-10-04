import { generateText } from 'ai';
import sharp from 'sharp';
import type { TextBlock } from '../ai/types';

const PRIMARY_MODEL = process.env.AI_INPAINT_MODEL || 'google/gemini-2.5-flash-image';
const FALLBACK_MODELS = (process.env.AI_INPAINT_FALLBACK_MODELS || 'google/gemini-3.1-flash-image')
  .split(',')
  .map(v => v.trim())
  .filter(Boolean);

function blockDescription(block: TextBlock) {
  const s: NonNullable<TextBlock["style"]> = block.style ?? { regionType: "unknown" };
  return '(' + Math.round(block.x) + ',' + Math.round(block.y) + ',' + Math.round(block.width) + 'x' + Math.round(block.height) + ') type=' + (s.regionType ?? 'unknown') + ' role=' + (s.visualRole ?? 'unknown') + ' text="' + block.text.slice(0,120) + '"';
}

export async function cleanComplexBackgroundWithAI(image: Uint8Array, blocks: TextBlock[]): Promise<Uint8Array> {
  if (process.env.AI_INPAINT_ENABLED === 'false') {
    throw new Error('Murakkab artwork matnini xavfsiz tozalash uchun AI inpainting yoqilgan bo‘lishi kerak.');
  }

  const complex = blocks.filter(block => {
    const mode = block.style?.backgroundMode ?? 'complex';
    return mode === 'complex' || ['sfx','background','sign'].includes(block.style?.regionType ?? '');
  });
  if (!complex.length) return image;

  const jpeg = new Uint8Array(await sharp(image).rotate().jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toBuffer());
  const prompt = [
    'MangaUZ professional CLEANING pass.',
    'Remove ONLY the original lettering in these exact text regions:',
    ...complex.map(blockDescription),
    'Hard requirements:',
    '- Do NOT erase characters, faces, hair, clothing, objects, panel borders, bubbles, screentone or shading.',
    '- Reconstruct only pixels that were behind the original letters.',
    '- Keep artwork identity, composition, dimensions and aspect ratio unchanged.',
    '- Do not add, translate or invent any text.',
    '- Do not put white/black rectangles over artwork.',
    '- Do not redraw the page. This is precise inpainting, not image generation.'
  ].join('\n');

  const models = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter(model => model !== PRIMARY_MODEL)];
  let generated: { uint8Array?: Uint8Array; mediaType: string } | undefined;
  let lastError: unknown = null;

  for (const model of models) {
    try {
      const result = await generateText({
        model,
        providerOptions: {
          gateway: { models },
          google: { responseModalities: ['TEXT', 'IMAGE'] }
        },
        messages: [{ role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image', image: jpeg, mediaType: 'image/jpeg' }
        ] }],
        maxOutputTokens: 1024
      });

      generated = result.files?.find(file => file.mediaType.startsWith('image/'));
      if (generated?.uint8Array) break;
      lastError = new Error('Model rasm qaytarmadi: ' + model);
    } catch (error) {
      lastError = error;
    }
  }

  if (!generated?.uint8Array) {
    const detail = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(
      'Original yozuvni xavfsiz tozalash uchun AI inpainting modeli mavjud emas. ' +
      'AI_INPAINT_MODEL yoki AI_INPAINT_FALLBACK_MODELS ni ishlaydigan image modelga sozlang. ' +
      'Oxirgi xato: ' + detail
    );
  }

  const originalMeta = await sharp(image).metadata();
  if (!originalMeta.width || !originalMeta.height) throw new Error('Original rasm o‘lchami aniqlanmadi.');
  return new Uint8Array(await sharp(generated.uint8Array).resize({ width: originalMeta.width, height: originalMeta.height, fit: 'fill' }).png().toBuffer());
}
