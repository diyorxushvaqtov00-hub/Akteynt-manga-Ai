import type { TextBlock } from "../ai/types";
import { cleanTextRegions } from "./clean-background";
import { cleanComplexBackgroundWithAI } from "./ai-inpaint";
import type { CleaningDecision, CleaningResult } from "./cleaning-types";

function mode(block: TextBlock) { return block.style?.backgroundMode ?? "complex"; }
function isBubble(block: TextBlock) {
  return ["speech", "thought", "narration", "caption"].includes(block.style?.regionType ?? "") && mode(block) === "solid";
}
function isComplex(block: TextBlock) {
  return mode(block) === "complex" || ["sfx", "background", "sign"].includes(block.style?.regionType ?? "");
}

export async function cleanPage(image: Uint8Array, blocks: TextBlock[]): Promise<CleaningResult> {
  const bubbleBlocks = blocks.filter(isBubble);
  const complexBlocks = blocks.filter(isComplex);
  const decisions: CleaningDecision[] = [
    ...bubbleBlocks.map(block => ({ blockId:block.id, method:"bubble-fill" as const, risk:"low" as const, reason:"Solid bubble/caption is cleaned locally.", estimatedCostUsd:0 })),
    ...complexBlocks.map(block => ({ blockId:block.id, method:"ai-inpaint" as const, risk:"high" as const, reason:"Artwork/texture crosses the lettering region.", estimatedCostUsd:Number(process.env.AI_INPAINT_COST_USD_PER_BLOCK || "0") })),
  ];
  let cleaned=image;
  if (bubbleBlocks.length) cleaned=await cleanTextRegions(cleaned,bubbleBlocks);
  if (complexBlocks.length) cleaned=await cleanComplexBackgroundWithAI(cleaned,complexBlocks);
  return { image:cleaned, decisions, aiUsed:complexBlocks.length>0, safe:cleaned.byteLength>0 };
}
