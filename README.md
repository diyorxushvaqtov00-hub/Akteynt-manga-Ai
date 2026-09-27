# Akteynt AI Manga Translator

AI manga/manhwa PDF translator.

## Core pipeline
PDF → sahifalar → Vision/OCR → Uzbek tarjima → original matnni tozalash → tarjima matnini joylash → PDF → Reader

## MVP
- PDF upload UI
- Uzbek translation workflow foundation
- 60–70 sahifali boblar uchun keyinchalik queue/worker arxitekturasi
- Har bir sahifa uchun progress va retry

## Stack
Next.js + TypeScript + Tailwind CSS

## Ishga tushirish
```bash
npm install
npm run dev
```
