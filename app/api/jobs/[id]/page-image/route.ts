import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "manga-files";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const searchParams = new URL(request.url).searchParams;
  const page = searchParams.get("page");
  const translated = searchParams.get("translated") !== "false";
  const pageNumber = Number(page);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return NextResponse.json({ error: "page parametri noto'g'ri." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("manga_pages")
    .select("original_image_path,translated_image_path,status")
    .eq("job_id", id)
    .eq("page_number", pageNumber)
    .single();

  const imagePath = translated ? data?.translated_image_path : data?.original_image_path;
  if (error || !imagePath || (translated && data?.status !== "translated")) {
    return NextResponse.json({ error: "Sahifa rasmi hali tayyor emas." }, { status: 404 });
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(imagePath, 60 * 10);

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Rasm URL yaratilmadi." }, { status: 500 });
  }

  return NextResponse.json({ jobId: id, pageNumber, url: signed.signedUrl });
}
