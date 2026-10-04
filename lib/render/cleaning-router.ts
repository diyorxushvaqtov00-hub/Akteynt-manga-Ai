import sharp from "sharp";
import type { TextBlock } from "../ai/types";
import { cleanTextRegions } from "./clean-background";
import { cleanComplexBackgroundWithAI } from "./ai-inpaint";
import type { CleaningDecision, CleaningResult } from "./cleaning-types";

function mode(b:TextBlock){return b.style?.backgroundMode??"complex";}
function bubble(b:TextBlock){return ["speech","thought","narration","caption"].includes(b.style?.regionType??"")&&mode(b)==="solid";}
function complex(b:TextBlock){return mode(b)==="complex"||["sfx","background","sign"].includes(b.style?.regionType??"");}

async function localInpaint(image:Uint8Array, blocks:TextBlock[]):Promise<Uint8Array>{
  // Conservative local fallback: only use the deterministic bubble cleaner here.
  // Texture/artwork regions are never covered by a rectangle.
  return cleanTextRegions(image, blocks);
}

export async function cleanPage(image:Uint8Array, blocks:TextBlock[]):Promise<CleaningResult>{
  const bubbleBlocks=blocks.filter(bubble);
  const complexBlocks=blocks.filter(complex);
  const decisions:CleaningDecision[]=[
    ...bubbleBlocks.map(b=>({blockId:b.id,method:"bubble-fill" as const,risk:"low" as const,reason:"Solid bubble/caption cleaned locally.",estimatedCostUsd:0})),
    ...complexBlocks.map(b=>({blockId:b.id,method:"ai-inpaint" as const,risk:"high" as const,reason:"Artwork/texture crosses lettering region; precise inpainting required.",estimatedCostUsd:Number(process.env.AI_INPAINT_COST_USD_PER_BLOCK||"0")}))
  ];
  let cleaned=image;
  if(bubbleBlocks.length) cleaned=await localInpaint(cleaned,bubbleBlocks);
  if(complexBlocks.length){
    cleaned=await cleanComplexBackgroundWithAI(cleaned,complexBlocks);
  }
  if(!cleaned.byteLength) throw new Error("Cleaning produced an empty image.");
  return {image:cleaned,decisions,aiUsed:complexBlocks.length>0,safe:true};
}