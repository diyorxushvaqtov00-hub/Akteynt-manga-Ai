import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getVisionProvider, assertVisionResult } from "@/lib/ai/provider";

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
  const { data: page, error } = await supabase
    .from("manga_pages")
    .select("id,original_image_path,status")
    .eq("job_id", id)
    .eq("page_number", pageNumber)
    .single();

  if (error || !page?.original_image_path) {
    return NextResponse.json({ error: "Sahifa rasmi hali tayyor emas." }, { status: 404 });
  }

  try {
    const { data: image, error: downloadError } = await supabase.storage
      .from(BUCKET).download(page.original_image_path);
    if (downloadError || !image) throw downloadError ?? new Error("Sahifa rasmi yuklanmadi.");

    const provider = getVisionProvider();
    const result = await provider.detectText(new Uint8Array(await image.arrayBuffer()));
    assertVisionResult(result);

    await supabase.from("manga_pages").update({ status: "analyzing", error: null })
      .eq("id", page.id);

    return NextResponse.json({
      ok: true,
      jobId: id,
      pageNumber,
      status: "analyzing",
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vision xatosi.";
    await supabase.from("manga_pages").update({ status: "failed", error: message })
      .eq("id", page.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
