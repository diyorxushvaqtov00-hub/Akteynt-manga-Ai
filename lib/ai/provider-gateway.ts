import { generateObject, generateText } from "ai";
import { z } from "zod";
import { MANGA_VISION_PROMPT, UZBEK_TRANSLATION_PROMPT } from "./prompts";
import type { VisionProvider } from "./provider";
import type { VisionPageResult, TextRegionType, TextStyle } from "./types";

const regionTypes: TextRegionType[] = [
  "speech", "thought", "narration", "caption", "sfx", "sign", "background", "unknown",
];

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
    style: z.object({
      regionType: z.enum(regionTypes as [TextRegionType, ...TextRegionType[]]).optional(),
      fontFamily: z.string().optional(),
      fontSize: z.number().positive().optional(),
      fontWeight: z.number().min(100).max(900).optional(),
      fontStyle: z.enum(["normal", "italic"]).optional(),
      fillColor: z.string().optional(),
      strokeColor: z.string().optional(),
      strokeWidth: z.number().min(0).max(20).optional(),
      align: z.enum(["left", "center", "right"]).optional(),
      direction: z.enum(["horizontal", "vertical"]).optional(),
      rotation: z.number().min(-180).max(180).optional(),
      bubbleShape: z.enum(["none", "round", "ellipse", "rectangle", "irregular"]).optional(),
      backgroundColor: z.string().optional(),
      backgroundMode: z.enum(["solid", "transparent", "complex"]).optional(),
    }).optional(),
  })),
});

const MODEL = process.env.AI_VISION_MODEL || "google/gemini-3.8-flash";
const FALLBACK_MODELS = ["google/gemini-3.7-flash", "google/gemini-3.5-flash", "google/gemini-2.5-flash"];

function normalizeColor(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
}

export class GatewayVisionProvider implements VisionProvider {
  async detectText(image: Uint8Array): Promise<VisionPageResult> {
    const { object } = await generateObject({
      model: MODEL,
      schema: visionSchema,
      system: MANGA_VISION_PROMPT,
      providerOptions: {
        gateway: { models: FALLBACK_MODELS },
      },
      maxOutputTokens: 12000,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Analyze the page at full visual fidelity. Detect and describe every text region and its typesetting style." },
          { type: "image", image, mediaType: "image/png" },
        ],
      }],
    });

    return {
      pageWidth: object.pageWidth,
      pageHeight: object.pageHeight,
      blocks: object.blocks.map((block) => ({
        ...block,
        style: {
          regionType: block.style?.regionType ?? "unknown",
          fontFamily: block.style?.fontFamily ?? "sans",
          fontWeight: block.style?.fontWeight ?? 700,
          fontStyle: block.style?.fontStyle ?? "normal",
          fillColor: normalizeColor(block.style?.fillColor, "#111111"),
          strokeColor: normalizeColor(block.style?.strokeColor, "#ffffff"),
          strokeWidth: block.style?.strokeWidth ?? 0,
          align: block.style?.align ?? "center",
          direction: block.style?.direction ?? "horizontal",
          rotation: block.style?.rotation ?? 0,
          bubbleShape: block.style?.bubbleShape ?? "none",
          backgroundColor: normalizeColor(block.style?.backgroundColor, "#ffffff"),
          backgroundMode: block.style?.backgroundMode ?? "complex",
        } satisfies TextStyle,
      })),
    };
  }

  async translate(text: string, context?: string): Promise<string> {
    const { text: result } = await generateText({
      model: process.env.AI_TRANSLATION_MODEL || MODEL,
      system: UZBEK_TRANSLATION_PROMPT,
      providerOptions: {
        gateway: { models: ["google/gemini-3.7-flash", "google/gemini-3.5-flash", "google/gemini-2.5-flash-lite"] },
      },
      maxOutputTokens: 1200,
      prompt: context ? `Context:
${context}

Source text:
${text}` : text,
    });

    return result.trim();
  }
}