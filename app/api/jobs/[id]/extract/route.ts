import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getRealPdfExtractor } from "@/lib/pdf";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: job, error } = await supabase
    .from("translation_jobs").select("id, filename, status").eq("id", id).single();

  if (error || !job) return NextResponse.json({ error: "Job topilmadi." }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "PDF fayl yuborilmadi." }, { status: 400 });

  try {
    const pdf = new Uint8Array(await file.arrayBuffer());
    const extractor = getRealPdfExtractor();
    const totalPages = await extractor.countPages(pdf);

    const { error: pageError } = await supabase.from("manga_pages").upsert(
      Array.from({ length: totalPages }, (_, i) => ({
        id: crypto.randomUUID(), job_id: id, page_number: i + 1, status: "pending",
      })),
      { onConflict: "job_id,page_number" },
    );
    if (pageError) throw pageError;

    await supabase.from("translation_jobs").update({
      status: "extracting", total_pages: totalPages, current_page: 0, progress: 0,
    }).eq("id", id);

    return NextResponse.json({ ok: true, jobId: id, status: "extracting", totalPages });
  } catch (error) {
    await supabase.from("translation_jobs").update({
      status: "failed", error: error instanceof Error ? error.message : "PDF extraction xatosi",
    }).eq("id", id);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF extraction xatosi." },
      { status: 500 },
    );
  }
}
