import { generateObject, generateText } from "ai";
import { z } from "zod";
import { MANGA_VISION_PROMPT } from "./prompts";
import type { VisionProvider } from "./provider";
import type { VisionPageResult } from "./types";

const visionSchema = z.object({
  pageWidth: z.number().positive(),
  pageHeight: z.number().positive(),
  blocks: z.array(z.object({
    id: z.string().min(1),
    text: z.string(),
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
    width: z.number().positive(),
    height: z.number().positive(),
    confidence: z.number().min(0).max(1).optional(),
  })),
});

const MODEL = process.env.AI_VISION_MODEL || "google/gemini-3.8-flash";

export class GatewayVisionProvider implements VisionProvider {
  async detectText(image: Uint8Array): Promise<VisionPageResult> {
    const { object } = await generateObject({
      model: MODEL,
      schema: visionSchema,
      system: MANGA_VISION_PROMPT,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Analyze this manga page and return every visible dialogue/narration text block with its bounding box." },
          { type: "image", image, mediaType: "image/png" },
        ],
      }],
    });

    return object;
  }

  async translate(text: string, context?: string): Promise<string> {
    const { text: result } = await generateText({
      model: process.env.AI_TRANSLATION_MODEL || MODEL,
      system: "Translate manga/manhwa dialogue naturally into Uzbek. Preserve names, tone, emotion and meaning. Return only the translation.",
      prompt: context ? `Context: ${context}\n\nText: ${text}` : text,
    });

    return result.trim();
  }
}
