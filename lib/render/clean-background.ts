import sharp from "sharp";
import type { TextBlock } from "../ai/types";

export interface CleanupBlock { x:number; y:number; width:number; height:number; style?:TextBlock["style"]; }

function clamp(v:number,min:number,max:number){return Math.max(min,Math.min(max,v));}
function validHex(v?:string){return !!v&&/^#[0-9a-fA-F]{6}$/.test(v);}
function rgb(hex:string){return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)] as const;}
function dist(a:[number,number,number],b:readonly number[]){return Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2]);}

/**
 * Local cleaner for genuinely solid bubbles/captions.
 * It removes pixels matching the detected lettering/stroke colors instead of
 * painting over the entire text box, so bubble borders and artwork survive.
 */
export async function cleanTextRegions(image:Uint8Array,blocks:CleanupBlock[]):Promise<Uint8Array>{
  let current=image;
  const baseMeta=await sharp(image).metadata();
  const pageW=baseMeta.width??1,pageH=baseMeta.height??1;

  for(const block of blocks.filter(b=>b.style?.backgroundMode==="solid")){
    const x=clamp(Math.round(block.x),0,pageW-1);
    const y=clamp(Math.round(block.y),0,pageH-1);
    const w=clamp(Math.round(block.width),1,pageW-x);
    const h=clamp(Math.round(block.height),1,pageH-y);
    const bg=validHex(block.style?.backgroundColor)?block.style!.backgroundColor!:"#ffffff";
    const fill=validHex(block.style?.fillColor)?block.style!.fillColor!:"#111111";
    const stroke=validHex(block.style?.strokeColor)?block.style!.strokeColor!:fill;
    const bgRgb=rgb(bg), fillRgb=rgb(fill), strokeRgb=rgb(stroke);

    const crop=await sharp(current).extract({left:x,top:y,width:w,height:h}).removeAlpha().raw().toBuffer();
    const rgba=Buffer.alloc(w*h*4);
    let hit=0;

    for(let py=0;py<h;py++){
      for(let px=0;px<w;px++){
        const i=(py*w+px)*3;
        const pixel:[number,number,number]=[crop[i],crop[i+1],crop[i+2]];
        const dFill=dist(pixel,fillRgb);
        const dStroke=dist(pixel,strokeRgb);
        const dBg=dist(pixel,bgRgb);
        const threshold=42;
        const textLike=(dFill<=threshold || dStroke<=threshold) && dBg>18;
        const o=(py*w+px)*4;
        rgba[o]=bgRgb[0]; rgba[o+1]=bgRgb[1]; rgba[o+2]=bgRgb[2];
        rgba[o+3]=textLike?255:0;
        if(textLike) hit++;
      }
    }

    // If the detected lettering color is too close to the bubble background,
    // use a conservative shape fill rather than leaving source text behind.
    if(hit<Math.max(2,Math.floor(w*h*0.0003))){
      const svg=Buffer.from(
        '<svg width="'+w+'" height="'+h+'" xmlns="http://www.w3.org/2000/svg">'+
        '<rect x="2" y="2" width="'+Math.max(1,w-4)+'" height="'+Math.max(1,h-4)+'" fill="'+bg+'"/></svg>'
      );
      current=new Uint8Array(await sharp(current).composite([{input:svg,left:x,top:y}]).png().toBuffer());
    }else{
      const overlay=await sharp(rgba,{raw:{width:w,height:h,channels:4}}).png().toBuffer();
      current=new Uint8Array(await sharp(current).composite([{input:overlay,left:x,top:y}]).png().toBuffer());
    }
  }

  return current;
}
