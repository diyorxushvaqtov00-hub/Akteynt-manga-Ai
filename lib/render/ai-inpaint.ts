import { generateText } from "ai";
import sharp from "sharp";
import type { TextBlock } from "../ai/types";

const MODEL = process.env.AI_INPAINT_MODEL || "google/gemini-3.1-flash-image";

function blockDescription(block: TextBlock) {
  const s = block.style ?? {};
  return `(${Math.round(block.x)},${Math.round(block.y)},${Math.round(block.width)}x${Math.round(block.height)}) type=${s.regionType ?? "unknown"}`;
}

/**
 * Uses a multimodal image-editing model for complex artwork regions where a
 * flat white rectangle would damage the manga art. The model receives the
 * original page and a precise list of text regions and is instructed to remove
 * only the original lettering while preserving characters, line art, shading,
 * panels and composition.
 *
 * If the model is unavailable, callers can safely fall back to deterministic
 * local rendering.
 */
export async function cleanComplexBackgroundWithAI(
  image: Uint8Array,
  blocks: TextBlock[],
): Promise<Uint8Array> {
  if (process.env.AI_INPAINT_ENABLED === "false") return image;

  const complex = blocks.filter((block) => {
    const mode = block.style?.backgroundMode ?? "complex";
    return mode === "complex" || ["sfx", "background", "sign"].includes(block.style?.regionType ?? "");
  });

  if (!complex.length) return image;

  const prompt = `Edit this manga/manhwa page as a professional lettering cleanup pass.

Remove ONLY the original text/lettering inside these regions:
${complex.map(blockDescription).join("\n")}

Hard requirements:
- Keep every character, face, hair, clothing, object, panel border, speech bubble, shading, texture and composition unchanged.
- Reconstruct the artwork that was behind the removed letters so it looks continuous and natural.
- Do not add any new text.
- Do not crop, rotate, reframe, upscale stylistically, recolor or redraw the page.
- Preserve the original page aspect ratio and composition exactly.
- This is an inpainting/editing task, not a new illustration.`;

  const result = await generateText({
    model: MODEL,
    providerOptions: {
      gateway: {
        models: ["google/gemini-3.1-flash-image", "google/gemini-2.5-flash-image"],
      },
      google: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    },
    messages: [{
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image", image, mediaType: "image/png" },
      ],
    }],
    maxOutputTokens: 1024,
  });

  const generated = result.files?.find((file) => file.mediaType.startsWith("image/"));
  if (!generated?.uint8Array) {
    throw new Error("AI inpainting modeli rasm qaytarmadi.");
  }

  const originalMeta = await sharp(image).metadata();
  return new Uint8Array(
    await sharp(generated.uint8Array)
      .resize({
        width: originalMeta.width,
        height: originalMeta.height,
        fit: "fill",
      })
      .png()
      .toBuffer(),
  );
}
