import { PdfJsExtractor } from "./extractor-real";
import type { PdfExtractor } from "./extractor";

export function getRealPdfExtractor(): PdfExtractor {
  return new PdfJsExtractor();
}