export type TextRegionType =
  | "speech"
  | "thought"
  | "narration"
  | "caption"
  | "sfx"
  | "sign"
  | "background"
  | "unknown";

export type TextAlign = "left" | "center" | "right";
export type TextDirection = "horizontal" | "vertical";

export interface TextStyle {
  regionType: TextRegionType;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  align?: TextAlign;
  direction?: TextDirection;
  rotation?: number;
  bubbleShape?: "none" | "round" | "ellipse" | "rectangle" | "irregular";
  backgroundColor?: string;
  backgroundMode?: "solid" | "transparent" | "complex";
}

export interface TextBlock {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  style?: TextStyle;
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