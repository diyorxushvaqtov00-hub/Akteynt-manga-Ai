export interface VisionProvider {
  detectText(image: Uint8Array): Promise<{
    pageWidth: number;
    pageHeight: number;
    blocks: Array<{
      id: string;
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
      confidence?: number;
    }>;
  }>;
  translate(text: string, context?: string): Promise<string>;
}

export function getVisionProvider(): VisionProvider {
  throw new Error(
    "AI provider hali sozlanmagan. Server environment orqali vision provider ulang.",
  );
}