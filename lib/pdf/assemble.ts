import { PDFDocument } from "pdf-lib";

export async function assemblePngsToPdf(images: Uint8Array[]) {
  const pdf = await PDFDocument.create();

  for (const image of images) {
    const png = await pdf.embedPng(image);
    const page = pdf.addPage([png.width, png.height]);
    page.drawImage(png, { x: 0, y: 0, width: png.width, height: png.height });
  }

  return new Uint8Array(await pdf.save());
}
