export interface TextLayoutInput {
  text: string;
  boxWidth: number;
  boxHeight: number;
}

export interface TextLayout {
  fontSize: number;
  lines: string[];
  lineHeight: number;
}

export function layoutText(input: TextLayoutInput): TextLayout {
  const words = input.text.trim().split(/\\s+/).filter(Boolean);
  if (!words.length) return { fontSize: 18, lines: [], lineHeight: 22 };

  const maxChars = Math.max(8, Math.floor(input.boxWidth / 12));
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  const maxLines = Math.max(1, Math.floor(input.boxHeight / 20));
  const visible = lines.slice(0, maxLines);

  return {
    fontSize: Math.max(10, Math.min(30, Math.floor(input.boxWidth / 16))),
    lines: visible,
    lineHeight: Math.max(14, Math.floor(input.boxHeight / Math.max(1, visible.length))),
  };
}