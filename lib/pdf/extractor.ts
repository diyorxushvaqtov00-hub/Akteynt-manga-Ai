export interface PdfPage {
  pageNumber: number;
  width: number;
  height: number;
  imagePath: string;
}

export interface PdfExtractor {
  countPages(pdf: Uint8Array): Promise<number>;
  extractPage(pdf: Uint8Array, pageNumber: number): Promise<Uint8Array>;
}

export function getPdfExtractor(): PdfExtractor {
  throw new Error(
    "PDF extractor hali server adapteriga ulanmagan. Bu qatlam PDF dvijogini almashtirish imkonini beradi.",
  );
}