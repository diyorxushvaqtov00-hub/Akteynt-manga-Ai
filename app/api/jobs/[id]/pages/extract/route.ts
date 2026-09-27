import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getRealPdfExtractor } from "@/lib/pdf";

export const runtime = "nodejs";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "manga-files";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const requestedPage = Number(body.pageNumber);

  if (!Number.isInteger(requestedPage) || requestedPage < 1) {
    return NextResponse.json({ error: "pageNumber noto'g'ri." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: job, error: jobError } = await supabase
    .from("translation_jobs")
    .select("id,total_pages,filename")
    .eq("id", id)
    .single();

  if (jobError || !job) return NextResponse.json({ error: "Job topilmadi." }, { status: 404 });
  if (!job.total_pages || requestedPage > job.total_pages) {
    return NextResponse.json({ error: "Bunday sahifa mavjud emas." }, { status: 400 });
  }

  const sourcePath = \`jobs/\${id}/source/\${job.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}\`;

  try {
    const { data: source, error: downloadError } = await supabase.storage
      .from(BUCKET).download(sourcePath);
    if (downloadError || !source) throw downloadError ?? new Error("PDF topilmadi.");

    const extractor = getRealPdfExtractor();
    const pdf = new Uint8Array(await source.arrayBuffer());
    const image = await extractor.extractPage(pdf, requestedPage);

    const imagePath = \`jobs/\${id}/pages/\${String(requestedPage).padStart(4, "0")}.png\`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(
      imagePath, image, { contentType: "image/png", upsert: true },
    );
    if (uploadError) throw uploadError;

    const { error: pageError } = await supabase.from("manga_pages").update({
      status: "processing",
      original_image_path: imagePath,
      error: null,
    }).eq("job_id", id).eq("page_number", requestedPage);
    if (pageError) throw pageError;

    const { count } = await supabase
      .from("manga_pages").select("id", { count: "exact", head: true })
      .eq("job_id", id).eq("status", "processing");

    return NextResponse.json({
      ok: true, jobId: id, pageNumber: requestedPage,
      imagePath, status: "processing", extractedPages: count ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sahifa extraction xatosi.";
    await supabase.from("manga_pages").update({ status: "failed", error: message })
      .eq("job_id", id).eq("page_number", requestedPage);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
