import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getRealPdfExtractor } from "@/lib/pdf";
import { getVisionProvider } from "@/lib/ai/provider";
import { renderTranslatedPage } from "@/lib/render/page";
import { assemblePngsToPdf } from "@/lib/pdf/assemble";
import { nextAttempt, retryDelayMs } from "@/lib/queue/retry";

export const runtime = "nodejs";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "manga-files";

function uuidFromBlockKey(pageId: string, blockKey: string) {
  const hex = createHash("sha256").update(`${pageId}:${blockKey}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  let activePageId: string | null = null;

  try {
    const { data: job, error } = await supabase
      .from("translation_jobs")
      .select("id,filename,source_path,total_pages")
      .eq("id", id).single();
    if (error || !job?.source_path) throw new Error("Job yoki source PDF topilmadi.");

    await supabase.rpc("recover_stale_manga_pages", {
      p_job_id: id,
      p_timeout_seconds: 900,
    });

    const { data: source, error: sourceError } = await supabase.storage.from(BUCKET).download(job.source_path);
    if (sourceError || !source) throw sourceError ?? new Error("Source PDF yuklanmadi.");

    const pdf = new Uint8Array(await source.arrayBuffer());
    const extractor = getRealPdfExtractor();
    const totalPages = job.total_pages ?? await extractor.countPages(pdf);

    if (!job.total_pages) {
      await supabase.from("translation_jobs").update({
        status: "processing", total_pages: totalPages, current_page: 0, progress: 0,
      }).eq("id", id);

      const rows = Array.from({ length: totalPages }, (_, i) => ({
        id: crypto.randomUUID(), job_id: id, page_number: i + 1, status: "pending",
      }));
      const { error: pageError } = await supabase.from("manga_pages")
        .upsert(rows, { onConflict: "job_id,page_number" });
      if (pageError) throw pageError;
    }

    const { data: pending, error: pendingError } = await supabase
      .from("manga_pages").select("id,page_number,status,original_image_path,attempts")
      .eq("job_id", id).in("status", ["pending", "failed"]).lt("attempts", 3)
      .order("page_number", { ascending: true }).limit(1);
    if (pendingError) throw pendingError;

    if (!pending?.length) {
      return NextResponse.json({ ok: true, status: "ready_to_assemble", progress: 95, totalPages });
    }

    const page = pending[0];
    activePageId = page.id;
    const now = new Date().toISOString();
    const next = nextAttempt(page.attempts ?? 0);
    if (next === null) throw new Error("Sahifa uchun maksimal urinishlar soniga yetildi.");
    const { data: claimedPage, error: claimError } = await supabase
      .from("manga_pages")
      .update({ attempts: next, last_attempt_at: now, locked_at: now, status: "processing" })
      .eq("id", page.id)
      .eq("status", page.status)
      .select("id")
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claimedPage) return NextResponse.json({ error: "Sahifa boshqa worker tomonidan olinmoqda." }, { status: 409 });
    if ((page.attempts ?? 0) > 0) await new Promise((resolve) => setTimeout(resolve, retryDelayMs(next)));
    await supabase.from("translation_jobs").update({
      status: "extracting", current_page: page.page_number,
      progress: Math.max(1, Math.round(((page.page_number - 1) / totalPages) * 90)),
    }).eq("id", id);

    let imagePath = page.original_image_path;
    if (!imagePath) {
      const image = await extractor.extractPage(pdf, page.page_number);
      imagePath = "jobs/" + id + "/pages/" + String(page.page_number).padStart(4, "0") + ".png";
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(imagePath, image, {
        contentType: "image/png", upsert: true,
      });
      if (uploadError) throw uploadError;
      await supabase.from("manga_pages").update({ original_image_path: imagePath, status: "processing" }).eq("id", page.id);
    }

    const { data: image } = await supabase.storage.from(BUCKET).download(imagePath);
    if (!image) throw new Error("Page image yuklanmadi.");

    await supabase.from("manga_pages").update({ status: "analyzing" }).eq("id", page.id);
    const vision = await getVisionProvider().detectText(new Uint8Array(await image.arrayBuffer()));

    const blocks = vision.blocks.map((b) => ({
      id: uuidFromBlockKey(page.id, b.id), page_id: page.id, block_key: b.id, source_text: b.text,
      x: b.x, y: b.y, width: b.width, height: b.height, confidence: b.confidence ?? null, status: "detected",
    }));
    if (blocks.length) {
      const { error: blockError } = await supabase.from("text_blocks").upsert(blocks, { onConflict: "page_id,block_key" });
      if (blockError) throw blockError;
    }

    await supabase.from("translation_jobs").update({
      status: "translating", progress: Math.max(2, Math.round(((page.page_number - 0.5) / totalPages) * 90)),
    }).eq("id", id);

    const { data: storedBlocks } = await supabase.from("text_blocks")
      .select("id,source_text,x,y,width,height,confidence,status,translated_text")
      .eq("page_id", page.id).order("created_at", { ascending: true });

    const provider = getVisionProvider();
    for (const block of storedBlocks ?? []) {
      if (block.status === "translated" && block.translated_text) continue;
      const translated = await provider.translate(block.source_text);
      const { error: updateError } = await supabase.from("text_blocks").update({
        translated_text: translated, status: "translated",
      }).eq("id", block.id);
      if (updateError) throw updateError;
    }

    const { data: translatedBlocks } = await supabase.from("text_blocks")
      .select("id,source_text,translated_text,x,y,width,height,confidence")
      .eq("page_id", page.id).eq("status", "translated");

    await supabase.from("manga_pages").update({ status: "rendering" }).eq("id", page.id);
    const rendered = await renderTranslatedPage(
      new Uint8Array(await image.arrayBuffer()),
      (translatedBlocks ?? []).map((b) => ({
        ...b, text: b.source_text, translatedText: b.translated_text ?? "",
      })),
    );

    const outputPath = "jobs/" + id + "/pages/" + String(page.page_number).padStart(4, "0") + "-uz.png";
    const { error: renderError } = await supabase.storage.from(BUCKET).upload(outputPath, rendered, {
      contentType: "image/png", upsert: true,
    });
    if (renderError) throw renderError;

    await supabase.from("manga_pages").update({
      status: "translated", translated_image_path: outputPath, error: null, locked_at: null,
    }).eq("id", page.id);

    const completed = page.page_number;
    const progress = Math.min(94, Math.round((completed / totalPages) * 94));
    await supabase.from("translation_jobs").update({
      status: completed === totalPages ? "assembling" : "processing",
      current_page: completed, progress,
    }).eq("id", id);

    if (completed < totalPages) {
      return NextResponse.json({ ok: true, status: "processing", pageNumber: completed, totalPages, progress });
    }

    const { data: allPages, error: allError } = await supabase.from("manga_pages")
      .select("page_number,translated_image_path,status").eq("job_id", id).order("page_number", { ascending: true });
    if (allError) throw allError;

    const images: Uint8Array[] = [];
    for (const p of allPages ?? []) {
      if (p.status !== "translated" || !p.translated_image_path) throw new Error("Barcha sahifalar tayyor emas.");
      const { data: img } = await supabase.storage.from(BUCKET).download(p.translated_image_path);
      if (!img) throw new Error("Rendered sahifa topilmadi.");
      images.push(new Uint8Array(await img.arrayBuffer()));
    }

    const outputPdf = await assemblePngsToPdf(images);
    const outputPdfPath = "jobs/" + id + "/output/translated-uz.pdf";
    const { error: pdfError } = await supabase.storage.from(BUCKET).upload(outputPdfPath, outputPdf, {
      contentType: "application/pdf", upsert: true,
    });
    if (pdfError) throw pdfError;

    await supabase.from("translation_jobs").update({
      status: "completed", progress: 100, current_page: totalPages, output_path: outputPdfPath, error: null,
    }).eq("id", id);

    return NextResponse.json({ ok: true, status: "completed", pageNumber: totalPages, totalPages, progress: 100, outputPath: outputPdfPath });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pipeline xatosi.";
    if (activePageId) {
      const { data: failedPage } = await supabase.from("manga_pages").update({
        status: "failed", error: message, locked_at: null,
      }).eq("id", activePageId).select("attempts").maybeSingle();
      if ((failedPage?.attempts ?? 0) >= 3) {
        await supabase.from("translation_jobs").update({ status: "failed", error: message }).eq("id", id);
      } else {
        await supabase.from("translation_jobs").update({ status: "processing", error: message }).eq("id", id);
      }
    } else {
      await supabase.from("translation_jobs").update({ status: "failed", error: message }).eq("id", id);
    }
    return NextResponse.json({ error: message, retryable: Boolean(activePageId) }, { status: 500 });
  }
}
