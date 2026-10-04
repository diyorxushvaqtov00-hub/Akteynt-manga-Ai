import sharp from "sharp";
import type { TextBlock } from "../ai/types";
import type { CleaningResult } from "./cleaning-types";

export interface VisualQAMetric {
  blockId:string;
  coverage:number;
  contrast:number;
  readable:boolean;
  insideBounds:boolean;
}
export interface VisualQAResult {
  safe:boolean;
  metrics:VisualQAMetric[];
  errors:string[];
}

/** Conservative geometry/legibility gate. It never claims pixels are clean unless the cleaner succeeded. */
export async function validateRenderedPage(image:Uint8Array, blocks:TextBlock[]):Promise<VisualQAResult>{
  const meta=await sharp(image).metadata();
  const W=meta.width??0,H=meta.height??0;
  const errors:string[]=[];
  const metrics:VisualQAMetric[]=blocks.map(b=>{
    const x=Math.round(b.x),y=Math.round(b.y),w=Math.round(b.width),h=Math.round(b.height);
    const insideBounds=x>=0&&y>=0&&w>0&&h>0&&x+w<=W&&y+h<=H;
    const area=Math.max(1,w*h);
    const pageArea=Math.max(1,W*H);
    const coverage=Math.min(1,area/pageArea);
    const readable=Boolean((b.text??"").trim())&&Number(b.confidence??1)>=0.45;
    if(!insideBounds) errors.push("Block "+b.id+" tashqarida: ("+x+","+y+","+w+","+h+")");
    if(!readable) errors.push("Block "+b.id+" OCR confidence/readability gate failed.");
    return {blockId:b.id,coverage,contrast:1,readable,insideBounds};
  });
  return {safe:errors.length===0,metrics,errors};
}

export function assertCleaningSafe(result:CleaningResult){
  if(!result.safe||!result.image?.byteLength) throw new Error("CLEAN_QA_FAILED: original lettering cleaning is not verified; typesetting blocked.");
}
