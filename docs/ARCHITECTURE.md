# Akteynt Manga AI — Target Architecture
## Version 1.0 — Professional Uzbek Manga Localization Pipeline

This document defines the target architecture before implementation changes. The system must optimize for visual fidelity, Uzbek translation quality, safe original-text removal, controllable cost, and deterministic export.

## 1. Product contract

Input:
- One manga/manhwa chapter PDF.
- PDF may contain raster manga pages and/or PDF-embedded images.
- Target language: Uzbek.

Output:
- A translated PDF with the original artwork preserved.
- Original lettering must never remain underneath translated text.
- Translation must be placed according to the visual role of the source text.
- The system must stop instead of producing a visually unsafe page.

Non-goals for this architecture:
- Reader/social/community features.
- Coins/payment UX.
- Full team collaboration.
These can be layered on later without changing the translation engine.

## 2. Core pipeline

PDF
  -> VALIDATE
  -> EXTRACT PAGES
  -> NORMALIZE IMAGE
  -> DETECT TEXT REGIONS
  -> OCR
  -> READING ORDER
  -> VISUAL STYLE ANALYSIS
  -> CONTEXT / CHARACTER MEMORY
  -> UZBEK TRANSLATION
  -> TRANSLATION QA
  -> CLEANING PLAN
  -> CHEAP CLEANING
  -> LOCAL INPAINTING
  -> PAID AI INPAINTING (only when required)
  -> CLEANING QA
  -> TYPESETTING
  -> VISUAL QA
  -> PDF ASSEMBLY
  -> FINAL VALIDATION
  -> DOWNLOAD

Hard rule:
No typesetting is allowed until CLEANING QA proves that the target source text is gone.

## 3. Page state machine

Each page is processed independently but shares chapter memory.

States:
UPLOADED
EXTRACTED
NORMALIZED
DETECTED
OCR_DONE
ANALYZED
TRANSLATED
TRANSLATION_QA
CLEAN_PLAN_READY
CLEANED
CLEAN_QA
TYPESET
VISUAL_QA
READY
FAILED_RETRYABLE
FAILED_HARD

Each transition records:
- started_at
- completed_at
- attempt
- provider/model
- input/output artifact
- error code
- quality score
- token/cost metadata where available

A page can retry a failed stage without repeating completed stages.

## 4. Engine modules

### A. PDF engine
Responsibilities:
- Validate PDF.
- Detect page count.
- Extract pages at a configurable DPI.
- Preserve page dimensions/aspect ratio.
- Normalize all working images to JPEG/PNG as required by the selected model.
- Assemble final PDF without unintended resizing.

Suggested modules:
lib/pdf/
- validate
- extractor
- normalize
- assemble
- types

### B. Vision / detection engine
Responsibilities:
- Detect every visible text region.
- Tight bounding boxes/polygons.
- Region type:
  speech, thought, narration, caption, sfx, sign, background, phone/screen, handwritten, unknown.
- Reading order.
- Speaker when inferable.
- Visual role.
- Text direction.
- Rotation.
- Bubble/background information.
- Confidence.

Detection result must be geometry-first. OCR text alone is insufficient.

### C. OCR engine
Responsibilities:
- Read original text.
- Preserve line structure where useful.
- Return confidence.
- Support Japanese/Korean/Chinese/English and mixed text.
- Send low-confidence regions through a second OCR pass or vision correction.
- Never invent missing text.

OCR result schema:
region_id
raw_text
normalized_text
confidence
language
bbox/polygon
line_count
reading_direction

### D. Visual style analyzer
For every region store:
- fontFamilyGuess
- sizeRatio
- weight
- italic/slant
- fillColor
- strokeColor
- strokeWidth
- alignment
- rotation
- vertical/horizontal
- bubbleShape
- bubbleFill
- bubbleBorder
- speaker
- emotionalRole
- visualRole

Important:
The renderer must not use one global font.

Style classes:
DIALOGUE
THOUGHT
NARRATION
CAPTION
SHOUT
WHISPER
EMPHASIS
SFX
SIGN
BACKGROUND

### E. Context / chapter memory
The translation engine receives:
- Previous translated regions.
- Character names.
- Character speaking style.
- Relationships.
- Honorific rules.
- Terminology glossary.
- Recurring SFX.
- Manga title/series context.
- Page order.
- Nearby bubbles.

Memory must be structured, not dumped as uncontrolled text.

### F. Uzbek translation engine
Translation rules:
- Natural Uzbek, not word-for-word output.
- Preserve meaning and emotional force.
- Preserve names/terms.
- Stable honorific handling.
- Correct o‘ and g‘.
- Maintain character voice.
- Keep text compact enough for the source region.
- SFX is localized visually, not merely appended as normal dialogue.
- No explanations in final translated text.

Two passes:
1. Draft translation.
2. Translation QA/correction.

### G. Cleaning planner
This module decides the cheapest safe cleaning method for each region.

Decision order:

1. Bubble-only text:
   -> reconstruct/fill bubble using geometry/color.
2. Flat/simple background:
   -> OpenCV/mask-based inpaint.
3. Screentone/simple texture:
   -> local inpainting.
4. Artwork crossing text:
   -> AI inpainting.
5. High-risk/low-confidence:
   -> do not typeset; send to visual QA/manual review state.

The planner returns:
method
mask
risk
confidence
estimated_cost
reason

### H. Local cleaner
Must be provider-independent.

Possible methods:
- OpenCV inpaint.
- Telea/Navier-Stokes.
- Bubble reconstruction.
- Mask dilation/erosion.
- Color sampling.
- LaMa-style local inpainting when available on a worker.

The local cleaner must operate on precise masks, not large rectangles.

### I. Paid AI cleaner
Paid AI is a fallback, not the default.

Provider adapter:
ImageCleanerProvider

Methods:
- clean(image, mask, metadata)
- estimateCost()
- healthCheck()

Providers must be replaceable:
- fal.ai
- Replicate
- other compatible provider

No application code may depend directly on a single vendor.

The current Gemini image-inpainting dependency must not remain a hard requirement.

### J. Cleaning QA
Compare:
source image
cleaned image
mask
region metadata

Checks:
- original glyph pixels not detectable inside the target region
- artwork outside the mask unchanged
- bubble border/tail preserved
- no white rectangle
- no obvious blur
- no broken face/clothing/panel border
- no accidental removal of non-text artwork

If failed:
CLEAN_PLAN_READY -> retry with stronger method
or
VISUAL_REVIEW_REQUIRED

Never:
CLEAN_FAILED -> TYPESET

### K. Professional typesetter
Input:
clean image + translated text + source style metadata.

Layout algorithm:
- fit text inside region.
- preserve margins.
- preserve line rhythm.
- avoid face/important artwork.
- calculate font size dynamically.
- calculate line breaks.
- support rotation.
- support vertical text.
- support stroke/fill.
- support alignment.
- support SFX deformation.
- preserve bubble tail.

Font selection is role-based, not global.

Fallback order:
exact style-matched bundled font
-> role font
-> Unicode-safe fallback

### L. Visual QA
Checks every rendered page:
1. No source text remains.
2. No translation is missing.
3. No translation is duplicated.
4. Text fits region.
5. Correct color/outline.
6. Correct orientation.
7. Correct reading order.
8. Artwork is not damaged.
9. No clipped glyphs.
10. Uzbek spelling is valid.
11. o‘/g‘ are correct.
12. SFX remains visually appropriate.
13. Bubble tail/border is intact.

Page is READY only when all mandatory checks pass.

## 5. Cost router

The router minimizes paid inference:

LOW RISK
  -> local/bubble cleaning

MEDIUM RISK
  -> local inpaint

HIGH RISK
  -> paid image AI

VERY HIGH RISK
  -> paid AI + mandatory visual QA

OCR and translation providers are also abstracted so they can be changed independently.

## 6. Storage model

Artifacts are immutable by stage.

jobs/{jobId}/
  source/chapter.pdf
  pages/{pageNo}/original.jpg
  pages/{pageNo}/normalized.jpg
  pages/{pageNo}/vision.json
  pages/{pageNo}/ocr.json
  pages/{pageNo}/translation.json
  pages/{pageNo}/mask.png
  pages/{pageNo}/cleaned.jpg
  pages/{pageNo}/typeset.jpg
  pages/{pageNo}/qa.json
  output/final.pdf

Never overwrite original artwork.

## 7. Database model

jobs
- id
- status
- source_name
- page_count
- target_language
- progress
- current_stage
- error_code
- created_at
- updated_at

pages
- id
- job_id
- page_number
- status
- width
- height
- original_path
- normalized_path
- cleaned_path
- typeset_path
- qa_score

text_blocks
- id
- page_id
- region_order
- region_type
- source_text
- normalized_text
- translated_text
- bbox/polygon
- confidence
- speaker
- visual_role
- style_json
- cleaning_method
- cleaning_confidence
- qa_status

chapter_memory
- job_id
- characters
- glossary
- honorific_rules
- terminology
- voice_profiles
- recurring_sfx

job_attempts
- job_id
- page_id
- stage
- attempt
- provider
- model
- duration_ms
- estimated_cost
- status
- error

## 8. API architecture

Public/job endpoints:
POST /api/upload/init
POST /api/upload/finalize
GET  /api/jobs/:id
GET  /api/jobs/:id/progress
POST /api/jobs/:id/process
POST /api/jobs/:id/vision
POST /api/jobs/:id/translate
POST /api/jobs/:id/render
POST /api/jobs/:id/assemble
GET  /api/jobs/:id/download

Internal engine interfaces:
VisionProvider
OCRProvider
TranslationProvider
ImageCleanerProvider
StorageProvider
PdfProvider

Routes must orchestrate. They must not contain model-specific image-processing logic.

## 9. Queue architecture

The long-running work must be treated as jobs, not as one giant HTTP request.

Job:
chapter
  -> page jobs
      -> detect
      -> OCR
      -> translate
      -> clean
      -> typeset
      -> QA

Concurrency is configurable.

Retry policy:
- transient network/provider errors: retry with backoff.
- rate limit: retry only after provider retry window; otherwise switch provider.
- validation error: no blind retry.
- visual QA failure: switch cleaning strategy.
- hard error: stop page and report exact stage.

## 10. Provider fallback policy

Text:
Primary -> fallback -> hard failure

Image cleaning:
Local -> paid primary -> paid fallback -> manual review

Never use:
paid primary -> paid primary again indefinitely.

Provider failure must not corrupt page state.

## 11. Quality gates

A page cannot become final unless:

Detection confidence >= threshold
OCR confidence >= threshold OR second-pass correction succeeds
Translation QA = PASS
Cleaning QA = PASS
Typesetting geometry = PASS
Visual QA = PASS

Chapter cannot become final unless:
all pages READY
PDF assembly succeeds
final PDF validation succeeds

## 12. PDF final validation

Check:
- file opens
- page count matches source
- every page exists
- dimensions are preserved
- no blank page
- no failed page artifact
- output size is sane
- images are readable
- metadata is valid

## 13. Deployment topology

Web/API:
Next.js on Vercel.

Database/storage:
Supabase behind StorageProvider/DatabaseProvider.

Heavy/local image processing:
Worker-compatible service, not Vercel request runtime.

The architecture must allow a later TCloud/VPS worker without rewriting the website.

Flow:
Vercel API
  -> database job
  -> worker
  -> storage
  -> database progress
  -> Vercel UI polling

This avoids putting CPU-heavy PDF/image work inside a short-lived serverless request.

## 14. Security

- AI/provider secrets server-side only.
- Service-role credentials never exposed to browser.
- Signed storage URLs with short expiry.
- Validate MIME type and extension.
- Validate PDF magic bytes.
- Limit page count/file size.
- Sanitize source filenames.
- Job ownership checks.
- Never trust client-supplied page paths.
- Provider responses validated before storage.

## 15. Implementation order

Phase 0 — Architecture and contracts
- Freeze schemas/interfaces.
- Freeze page state machine.
- Add architecture tests.

Phase 1 — Stable PDF pipeline
- extraction
- normalization
- storage
- assembly

Phase 2 — Detection/OCR
- precise regions
- confidence
- reading order
- style metadata

Phase 3 — Translation
- chapter memory
- Uzbek translation
- QA

Phase 4 — Cleaning engine
- bubble cleaner
- OpenCV cleaner
- local inpaint adapter
- paid AI adapter
- cleaning QA

Phase 5 — Professional typesetting
- style-aware fonts
- rotation
- SFX
- bubble geometry
- fit algorithm

Phase 6 — Visual QA
- automated gates
- page-level failure recovery

Phase 7 — Production worker
- queue
- concurrency
- retry
- cost accounting

Phase 8 — Final PDF
- assembly
- validation
- download

## 16. Current repository mapping

Existing components that should be preserved where sound:
- lib/ai/prompts.ts
- lib/ai/provider-gateway.ts
- lib/ai/types.ts
- lib/render/page.ts
- lib/render/text-layout.ts
- lib/render/clean-background.ts
- lib/render/ai-inpaint.ts
- lib/pdf/*
- app/api/jobs/*
- Supabase migrations

Components that need refactoring:
- AI image cleaning must become provider-agnostic.
- Cleaning must have local-first routing.
- Page rendering must consume structured style metadata.
- QA must become a real blocking gate.
- Long-running processing must move toward a worker/queue model.

## 17. Absolute quality rules

1. Never write Uzbek text over uncleared source text.
2. Never replace a manga region with a generic white rectangle.
3. Never force one font over all text.
4. Never destroy artwork outside a precise mask.
5. Never silently accept failed QA.
6. Never make paid AI mandatory for simple pages.
7. Never couple the application to one AI provider.
8. Never lose original page artifacts.
9. Never translate without chapter/page context when context exists.
10. Never declare a chapter complete while any page is unsafe.

## 18. Definition of done

The architecture is considered implemented only when a real test chapter can go:

PDF upload
-> all pages detected
-> all text OCR'd
-> Uzbek translated
-> original text safely removed
-> style-preserving typeset
-> visual QA passed
-> final PDF generated

and the output is visually acceptable page-by-page, not merely technically downloadable.
