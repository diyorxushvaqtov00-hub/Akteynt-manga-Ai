import sharp from "sharp";
import type { TextBlock } from "../ai/types";

export interface CleanupBlock { x:number; y:number; width:number; height:number; style?:TextBlock["style"]; }
function clamp(v:number,min:number,max:number){return Math.max(min,Math.min(max,v));}
function validHex(v?:string){return !!v&&/^#[0-9a-fA-F]{6}$/.test(v);}
function esc(v:string){return v.replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;");}

/** Local-only cleaner. Complex artwork is deliberately refused here. */
export async function cleanTextRegions(image:Uint8Array,blocks:CleanupBlock[]):Promise<Uint8Array>{
 const base=sharp(image), meta=await base.metadata(), width=meta.width??1,height=meta.height??1;
 const overlays=blocks.filter(b=>b.style?.backgroundMode==="solid").map(b=>{
  const x=clamp(Math.round(b.x),0,width-1),y=clamp(Math.round(b.y),0,height-1);
  const w=clamp(Math.round(b.width),1,width-x),h=clamp(Math.round(b.height),1,height-y);
  const inset=Math.max(1,Math.round(Math.min(w,h)*0.025));
  const bg=validHex(b.style?.backgroundColor)?b.style!.backgroundColor!:"#ffffff";
  const shape=b.style?.bubbleShape??"rectangle";
  let s:string;
  if(shape==="ellipse") s=`<ellipse cx="${x+w/2}" cy="${y+h/2}" rx="${Math.max(1,w/2-inset)}" ry="${Math.max(1,h/2-inset)}" fill="${esc(bg)}"/>`;
  else if(shape==="round") {const r=Math.max(3,Math.min(60,Math.round(Math.min(w,h)*.22)));s=`<rect x="${x+inset}" y="${y+inset}" width="${Math.max(1,w-inset*2)}" height="${Math.max(1,h-inset*2)}" rx="${r}" fill="${esc(bg)}"/>`;}
  else s=`<rect x="${x+inset}" y="${y+inset}" width="${Math.max(1,w-inset*2)}" height="${Math.max(1,h-inset*2)}" fill="${esc(bg)}"/>`;
  return {input:Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`)};
 });
 if(!overlays.length)return image;
 return new Uint8Array(await base.composite(overlays).png().toBuffer());
}