# Akteynt AI Manga Translator

AI manga/manhwa PDF translator: PDF → sahifalar → Vision/OCR → o‘zbekcha tarjima → render → PDF + Reader.

## Hozirgi imkoniyatlar
- PDF upload (100 MB gacha)
- Supabase Storage'da private fayl saqlash
- PDF sahifalarini PNG'ga chiqarish
- Vision/OCR orqali matn bloklari va koordinatalarini aniqlash
- Gemini orqali o‘zbekcha tarjima
- Har bir sahifani qayta ishlash, retry va stale-worker recovery
- Tarjima qilingan sahifalarni PNG sifatida saqlash
- Yakuniy tarjima qilingan PDF yaratish
- Brauzer Reader: sahifa oldinga/orqaga o'tish
- Signed URL orqali fayllarni vaqtinchalik berish
- DB-backed progress va job status

## Stack
Next.js + TypeScript + Tailwind CSS + Supabase + Vercel AI SDK + Gemini + pdfjs-dist + Sharp + pdf-lib.

## Lokal ishga tushirish
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Muhit o‘zgaruvchilari
`.env.local` ichida:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_GATEWAY_API_KEY`

**Service role key faqat serverda saqlanadi; uni frontend kodiga chiqarmang.**

## Supabase
`supabase/migrations/` ichidagi migrationlarni tartib bilan qo‘llang:
1. `001_translation_pipeline.sql`
2. `002_text_blocks.sql`
3. `003_source_and_output.sql`
4. `004_job_attempts.sql`
5. `005_updated_at.sql`

Supabase Storage'da `manga-files` nomli **private** bucket yarating.

## Pipeline
```text
PDF upload
   ↓
Supabase Storage
   ↓
PDF page extraction
   ↓
Vision/OCR
   ↓
Text blocks + coordinates
   ↓
Uzbek translation
   ↓
Original text cleanup
   ↓
Translated text rendering
   ↓
Translated PNG pages
   ↓
Final PDF
   ↓
Reader / Download
```

## API
- `POST /api/upload/init` — upload uchun signed URL olish
- `POST /api/upload/finalize` — uploadni job bilan bog‘lash
- `GET /api/jobs/:id` — job holati
- `POST /api/jobs/:id/process` — navbatdagi sahifani qayta ishlash
- `GET /api/jobs/:id/pages` — sahifalar
- `GET /api/jobs/:id/page-image?page=N&translated=true` — signed sahifa rasmi
- `GET /api/jobs/:id/download` — tayyor PDF signed URL
- `POST /api/jobs/:id/assemble` — PDF assembly
- `POST /api/jobs/:id/vision` — Vision/OCR
- `POST /api/jobs/:id/translate` — tarjima
- `POST /api/jobs/:id/render` — render

## Eslatma
Hozirgi cleanup oqimi oq/och rangli speech bubble'lar uchun konservativ raster overlay ishlatadi. Murakkab fonlarda haqiqiy AI inpainting keyingi sifat bosqichi sifatida qo‘shilishi kerak. Ishlab chiqarishdan oldin authentication, rate limiting va real Supabase/AI E2E testi ham majburiy.