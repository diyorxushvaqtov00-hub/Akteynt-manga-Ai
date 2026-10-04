import type { TextAlign, TextDirection } from "../ai/types";

export interface TextLayoutInput {
  text:string; boxWidth:number; boxHeight:number; preferredFontSize?:number;
  direction?:TextDirection; role?:string; fontWeight?:number;
}
export interface TextLayout {fontSize:number;lines:string[];lineHeight:number;direction:TextDirection;}

function widthOf(text:string,size:number){
  return [...text].reduce((n,ch)=>{
    if(/[\u4e00-\u9fff\u3040-\u30ff]/.test(ch)) return n+size;
    if(/[A-ZА-ЯЁ0-9]/.test(ch)) return n+size*.60;
    if(/[.,!?;:'"‘’“”]/.test(ch)) return n+size*.28;
    return n+size*.52;
  },0);
}
function wrap(text:string,w:number,size:number){
  const out:string[]=[];
  for(const p of text.split(/\n+/)){
    const words=p.trim().split(/\s+/).filter(Boolean);
    if(!words.length){out.push("");continue;}
    let line="";
    for(const word of words){
      const candidate=line?line+" "+word:word;
      if(line && widthOf(candidate,size)>w*.9){out.push(line);line=word;}
      else if(!line && widthOf(word,size)>w*.9){
        let chunk="";
        for(const ch of [...word]){
          if(chunk&&widthOf(chunk+ch,size)>w*.9){out.push(chunk);chunk=ch;} else chunk+=ch;
        }
        line=chunk;
      } else line=candidate;
    }
    if(line)out.push(line);
  }
  return out;
}
export function layoutText(input:TextLayoutInput):TextLayout{
  const text=input.text.trim(), direction=input.direction??"horizontal";
  if(!text)return {fontSize:18,lines:[],lineHeight:22,direction};
  const w=Math.max(20,input.boxWidth),h=Math.max(20,input.boxHeight);
  const role=(input.role??"dialogue").toLowerCase();
  const preferred=Math.max(8,Math.min(96,input.preferredFontSize??(
    role==="sfx"?Math.min(48,Math.max(18,w*.12)):
    role==="shout"?Math.min(40,Math.max(16,w*.085)):
    role==="whisper"?Math.min(24,Math.max(10,w*.055)):
    Math.min(32,Math.max(12,w*.065))
  )));
  let size=preferred,lines=wrap(text,w,size);
  const maxH=h*.84;
  while(size>8 && (lines.length*size*(role==="sfx"?1.0:1.16)>maxH || lines.some(x=>widthOf(x,size)>w*.9))){
    size-=1; lines=wrap(text,w,size);
  }
  const lineHeight=Math.max(10,Math.round(size*(role==="sfx"?1.0:1.16)));
  return {fontSize:size,lines,lineHeight,direction};
}
export function anchorForAlign(align:TextAlign){return align==="left"?"start":align==="right"?"end":"middle";}
