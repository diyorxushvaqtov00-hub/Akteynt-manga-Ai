import type { TextAlign, TextDirection } from "../ai/types";

export interface TextLayoutInput {
  text: string;
  boxWidth: number;
  boxHeight: number;
  preferredFontSize?: number;
  direction?: TextDirection;
}

export interface TextLayout {
  fontSize: number;
  lines: string[];
  lineHeight: number;
  direction: TextDirection;
}

export function layoutText(input: TextLayoutInput): TextLayout {
  const text = input.text.trim();
  const direction = input.direction ?? "horizontal";
  if (!text) return { fontSize: 18, lines: [], lineHeight: 22, direction };

  const boxWidth = Math.max(20, input.boxWidth);
  const boxHeight = Math.max(20, input.boxHeight);
  const preferred = Math.max(10, Math.min(72, input.preferredFontSize ?? 28));

  let fontSize = preferred;
  let lines = wrapText(text, boxWidth, fontSize);
  const maxHeight = boxHeight * 0.88;

  while (fontSize > 9 && lines.length * fontSize * 1.18 > maxHeight) {
    fontSize -= 1;
    lines = wrapText(text, boxWidth, fontSize);
  }

  while (fontSize > 9 && lines.some((line) => estimateWidth(line, fontSize) > boxWidth * 0.92)) {
    fontSize -= 1;
    lines = wrapText(text, boxWidth, fontSize);
  }

  const lineHeight = Math.max(11, Math.min(boxHeight, Math.round(fontSize * 1.18)));
  return { fontSize, lines, lineHeight, direction };
}

function estimateWidth(text: string, fontSize: number) {
  return [...text].reduce((sum, ch) => sum + (/[\u4e00-\u9fff\u3040-\u30ff]/.test(ch) ? fontSize : fontSize * 0.52), 0);
}

function wrapText(text: string, boxWidth: number, fontSize: number) {
  const maxChars = Math.max(2, Math.floor(boxWidth / Math.max(5, fontSize * 0.52)));
  const paragraphs = text.split(/\n+/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }

    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && (candidate.length > maxChars || estimateWidth(candidate, fontSize) > boxWidth * 0.92)) {
        lines.push(current);
        current = word;
      } else if (!current && estimateWidth(word, fontSize) > boxWidth * 0.92) {
        let chunk = "";
        for (const char of [...word]) {
          const next = chunk + char;
          if (estimateWidth(next, fontSize) > boxWidth * 0.92 && chunk) {
            lines.push(chunk);
            chunk = char;
          } else {
            chunk = next;
          }
        }
        current = chunk;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

export function anchorForAlign(align: TextAlign) {
  return align === "left" ? "start" : align === "right" ? "end" : "middle";
}