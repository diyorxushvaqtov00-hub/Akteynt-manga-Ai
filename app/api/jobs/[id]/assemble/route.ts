import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { assemblePngsToPdf } from "@/lib/pdf/assemble";

export const runtime = "nodejs";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "manga-files";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  try {
    const { data: job, error: jobError } = await supabase
      .from("translation_jobs").select("id,total_pages").eq("id", id).single();
    if (jobError || !job?.total_pages) throw new Error("Job yoki sahifalar topilmadi.");

    const { data: pages, error: pagesError } = await supabase
      .from("manga_pages").select("page_number,translated_image_path,status")
      .eq("job_id", id).order("page_number", { ascending: true });
    if (pagesError) throw pagesError;
    if (pages.length !== job.total_pages || pages.some((p) => p.status !== "translated" || !p.translated_image_path)) {
      throw new Error("Barcha sahifalar hali render qilinmagan.");
    }

    await supabase.from("translation_jobs").update({ status: "assembling", progress: 95 }).eq("id", id);

    const images: Uint8Array[] = [];
    for (const page of pages) {
      const { data: image, error } = await supabase.storage.from(BUCKET).download(page.translated_image_path);
      if (error || !image) throw error ?? new Error("Tarjima qilingan sahifa topilmadi.");
      images.push(new Uint8Array(await image.arrayBuffer()));
    }

    const pdf = await assemblePngsToPdf(images);
    const outputPath = "jobs/" + id + "/output/translated-uz.pdf";
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(
      outputPath, pdf, { contentType: "application/pdf", upsert: true },
    );
    if (uploadError) throw uploadError;

    await supabase.from("translation_jobs").update({
      status: "completed", progress: 100, current_page: job.total_pages, output_path: outputPath, error: null,
    }).eq("id", id);

    return NextResponse.json({ ok: true, jobId: id, status: "completed", outputPath });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF assembly xatosi.";
    await supabase.from("translation_jobs").update({ status: "failed", error: message }).eq("id", id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
