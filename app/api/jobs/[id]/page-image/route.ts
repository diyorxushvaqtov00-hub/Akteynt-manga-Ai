import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "manga-files";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const page = new URL(request.url).searchParams.get("page");
  const pageNumber = Number(page);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return NextResponse.json({ error: "page parametri noto'g'ri." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("manga_pages")
    .select("original_image_path")
    .eq("job_id", id)
    .eq("page_number", pageNumber)
    .single();

  if (error || !data?.original_image_path) {
    return NextResponse.json({ error: "Sahifa rasmi topilmadi." }, { status: 404 });
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(data.original_image_path, 60 * 10);

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Rasm URL yaratilmadi." }, { status: 500 });
  }

  return NextResponse.json({ jobId: id, pageNumber, url: signed.signedUrl });
}
