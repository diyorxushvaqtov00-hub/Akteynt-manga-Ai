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
  const text = input.text.trim();
  if (!text) return { fontSize: 18, lines: [], lineHeight: 22 };

  const boxWidth = Math.max(20, input.boxWidth);
  const boxHeight = Math.max(20, input.boxHeight);
  const words = text.split(/\s+/).filter(Boolean);
  const maxLines = Math.max(1, Math.floor(boxHeight / 18));

  let fontSize = Math.max(10, Math.min(30, Math.floor(boxWidth / 15)));
  let lines = wrapWords(words, Math.max(8, Math.floor(boxWidth / Math.max(7, fontSize * 0.55))));

  while (lines.length > maxLines && fontSize > 10) {
    fontSize -= 1;
    lines = wrapWords(words, Math.max(8, Math.floor(boxWidth / Math.max(7, fontSize * 0.55))));
  }

  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    const last = lines[maxLines - 1] ?? "";
    lines[maxLines - 1] = last.length > 3 ? last.slice(0, Math.max(1, last.length - 1)) + "…" : last;
  }

  const lineHeight = Math.max(14, Math.min(Math.floor(boxHeight / Math.max(1, lines.length)), Math.round(fontSize * 1.25)));

  return { fontSize, lines, lineHeight };
}

function wrapWords(words: string[], maxChars: number) {
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > maxChars && !current) {
      let rest = word;
      while (rest.length > maxChars) {
        lines.push(rest.slice(0, maxChars - 1) + "-");
        rest = rest.slice(maxChars - 1);
      }
      current = rest;
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines;
}
