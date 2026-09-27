import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import sharp from "sharp";
import type { PdfExtractor } from "./extractor";

export class PdfJsExtractor implements PdfExtractor {
  async countPages(pdf: Uint8Array): Promise<number> {
    const document = await pdfjsLib.getDocument({ data: pdf }).promise;
    return document.numPages;
  }

  async extractPage(pdf: Uint8Array, pageNumber: number): Promise<Uint8Array> {
    const document = await pdfjsLib.getDocument({ data: pdf }).promise;
    const page = await document.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.6 });

    const canvas = new OffscreenCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height),
    );
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Canvas context yaratilmadi.");

    await page.render({
      canvasContext: context as never,
      viewport,
    }).promise;

    const blob = await canvas.convertToBlob({ type: "image/png" });
    const buffer = new Uint8Array(await blob.arrayBuffer());

    return new Uint8Array(
      await sharp(buffer).png({ compressionLevel: 9 }).toBuffer(),
    );
  }
}