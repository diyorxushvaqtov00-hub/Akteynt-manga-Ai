export interface TextBlock {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

export interface VisionPageResult {
  pageWidth: number;
  pageHeight: number;
  blocks: TextBlock[];
}

export interface TranslationResult {
  source: string;
  target: string;
  blockId: string;
}