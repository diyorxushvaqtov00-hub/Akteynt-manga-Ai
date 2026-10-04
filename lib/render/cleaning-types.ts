import type { TextBlock } from "../ai/types";

export type CleaningMethod = "bubble-fill" | "local-inpaint" | "ai-inpaint" | "manual-review" | "none";
export type CleaningRisk = "low" | "medium" | "high" | "critical";

export interface CleaningDecision {
  blockId: string;
  method: CleaningMethod;
  risk: CleaningRisk;
  reason: string;
  estimatedCostUsd: number;
}

export interface CleaningResult {
  image: Uint8Array;
  decisions: CleaningDecision[];
  aiUsed: boolean;
  safe: boolean;
  errors?: string[];
}

export interface CleaningProvider {
  clean(image: Uint8Array, blocks: TextBlock[]): Promise<Uint8Array>;
  healthCheck?(): Promise<boolean>;
  estimateCost?(blocks: TextBlock[]): number;
}
