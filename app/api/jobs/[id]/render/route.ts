import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { renderTranslatedPage } from "@/lib/render/page";

export const runtime = "nodejs";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "manga-files";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const pageNumber = Number(body.pageNumber);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return NextResponse.json({ error: "pageNumber noto'g'ri." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: page } = await supabase
    .from("manga_pages").select("id,original_image_path")
    .eq("job_id", id).eq("page_number", pageNumber).single();

  if (!page?.original_image_path) {
    return NextResponse.json({ error: "Original sahifa topilmadi." }, { status: 404 });
  }

  try {
    const [{ data: image }, { data: blocks }] = await Promise.all([
      supabase.storage.from(BUCKET).download(page.original_image_path),
      supabase.from("text_blocks").select("id,source_text,translated_text,x,y,width,height,confidence")
        .eq("page_id", page.id).eq("status", "translated"),
    ]);

    if (!image) throw new Error("Original rasm yuklanmadi.");
    if (!blocks?.length) throw new Error("Tarjima qilingan text block topilmadi.");

    const rendered = await renderTranslatedPage(
      new Uint8Array(await image.arrayBuffer()),
      blocks.map((block) => ({
        ...block,
        id: block.id,
        text: block.source_text,
        translatedText: block.translated_text ?? "",
      })),
    );

    const outputPath = \`jobs/\${id}/pages/\${String(pageNumber).padStart(4, "0")}-uz.png\`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(
      outputPath, rendered, { contentType: "image/png", upsert: true },
    );
    if (uploadError) throw uploadError;

    const { error: updateError } = await supabase.from("manga_pages").update({
      status: "translated",
      translated_image_path: outputPath,
      error: null,
    }).eq("id", page.id);
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, jobId: id, pageNumber, outputPath, status: "translated" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render xatosi.";
    await supabase.from("manga_pages").update({ status: "failed", error: message }).eq("id", page.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
