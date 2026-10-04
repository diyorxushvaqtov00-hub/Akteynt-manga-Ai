import sharp from "sharp";
import type { TextBlock } from "../ai/types";

export interface CleaningQAResult {
  safe: boolean;
  errors: string[];
  changedInside: number;
  changedOutside: number;
}

function clamp(v:number,min:number,max:number){return Math.max(min,Math.min(max,v));}

function region(block:TextBlock,w:number,h:number){
  const x=clamp(Math.round(block.x),0,w-1);
  const y=clamp(Math.round(block.y),0,h-1);
  const rw=clamp(Math.round(block.width),1,w-x);
  const rh=clamp(Math.round(block.height),1,h-y);
  return {x,y,w:rw,h:rh};
}

function inAnyRegion(x:number,y:number,blocks:TextBlock[],w:number,h:number){
  return blocks.some(block=>{
    const r=region(block,w,h);
    return x>=r.x && x<r.x+r.w && y>=r.y && y<r.y+r.h;
  });
}

/**
 * Pixel-level safety gate for the cleaning pass.
 * It does not claim OCR-perfect deletion; it verifies that:
 * 1) the cleaner returned the same canvas dimensions,
 * 2) target regions actually changed when complex inpainting was requested,
 * 3) artwork outside target regions was not broadly rewritten.
 */
export async function verifyCleaning(
  original:Uint8Array,
  cleaned:Uint8Array,
  blocks:TextBlock[],
):Promise<CleaningQAResult>{
  const [a,b]=await Promise.all([
    sharp(original).removeAlpha().raw().toBuffer({resolveWithObject:true}),
    sharp(cleaned).removeAlpha().raw().toBuffer({resolveWithObject:true}),
  ]);

  if(a.info.width!==b.info.width || a.info.height!==b.info.height || a.info.channels!==b.info.channels){
    return {safe:false,errors:["Cleaning canvas o‘lchami yoki rang kanallari o‘zgargan."],changedInside:0,changedOutside:0};
  }

  const w=a.info.width,h=a.info.height,channels=a.info.channels;
  const step=Math.max(1,Math.floor(Math.sqrt((w*h)/180000)));
  let insideSum=0,outsideSum=0,insideN=0,outsideN=0;

  for(let y=0;y<h;y+=step){
    for(let x=0;x<w;x+=step){
      const i=(y*w+x)*channels;
      const diff=Math.abs(a.data[i]-b.data[i])+
        Math.abs((a.data[i+1]??a.data[i])-(b.data[i+1]??b.data[i]))+
        Math.abs((a.data[i+2]??a.data[i])-(b.data[i+2]??b.data[i]));
      if(inAnyRegion(x,y,blocks,w,h)){insideSum+=diff;insideN++;}
      else {outsideSum+=diff;outsideN++;}
    }
  }

  const changedInside=insideN?insideSum/(insideN*3):0;
  const changedOutside=outsideN?outsideSum/(outsideN*3):0;
  const errors:string[]=[];

  const complexBlocks=blocks.filter(b=>{
    const mode=b.style?.backgroundMode??"complex";
    return mode==="complex" || ["sfx","background","sign"].includes(b.style?.regionType??"");
  });

  if(complexBlocks.length && changedInside<2){
    errors.push("Murakkab matn hududlari inpaintingdan keyin yetarlicha o‘zgarmadi; original lettering qolgan bo‘lishi mumkin.");
  }
  if(changedOutside>28){
    errors.push("Cleaning artworkning matn hududidan tashqarisini haddan tashqari o‘zgartirdi; sahifa qayta ishlashga qaytarildi.");
  }

  return {safe:errors.length===0,errors,changedInside,changedOutside};
}
