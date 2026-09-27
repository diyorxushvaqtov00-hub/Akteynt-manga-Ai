export const MANGA_VISION_PROMPT = `
You are analyzing a manga/manhwa page.

Detect every visible dialogue, narration, sound effect, and text block.
Return structured JSON only.

For each text block provide:
- id
- exact original text
- x, y, width, height in pixels
- confidence from 0 to 1

Do not translate yet.
Preserve reading order.
`;

export const UZBEK_TRANSLATION_PROMPT = `
Translate manga/manhwa dialogue into natural Uzbek.
Preserve character names, emotions, tone, honorific meaning, and context.
Do not add explanations.
Return only the translated text.
`;