import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

export interface PdfAssemblyOptions {
  title?: string;
  author?: string;
  subject?: string;
}

export async function assemblePngsToPdf(images: Uint8Array[], options:PdfAssemblyOptions={}){
  if(!images.length) throw new Error("PDF_ASSEMBLY_FAILED: translated pages are empty.");
  const pdf=await PDFDocument.create();
  pdf.setTitle(options.title??"Akteynt Manga AI — Uzbek Translation");
  pdf.setAuthor(options.author??"Akteynt Manga AI");
  pdf.setSubject(options.subject??"AI-assisted Uzbek manga localization");

  for(let i=0;i<images.length;i++){
    const image=images[i];
    if(!image?.byteLength) throw new Error("PDF_ASSEMBLY_FAILED: page "+(i+1)+" is empty.");
    const meta=await sharp(image).metadata();
    if(!meta.width||!meta.height) throw new Error("PDF_ASSEMBLY_FAILED: page "+(i+1)+" dimensions unavailable.");
    const png=await pdf.embedPng(image);
    const page=pdf.addPage([png.width,png.height]);
    page.drawImage(png,{x:0,y:0,width:png.width,height:png.height});
  }
  const bytes=new Uint8Array(await pdf.save());
  if(bytes.length<100) throw new Error("PDF_ASSEMBLY_FAILED: generated PDF is invalid/empty.");
  return bytes;
}