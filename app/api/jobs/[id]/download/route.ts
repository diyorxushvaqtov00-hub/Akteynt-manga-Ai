import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSupabaseStorage } from "@/lib/supabase-storage";

export const runtime = "nodejs";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "manga-files";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: job, error } = await supabase
    .from("translation_jobs").select("output_path,status").eq("id", id).single();

  if (error || !job) return NextResponse.json({ error: "Job topilmadi." }, { status: 404 });
  if (job.status !== "completed" || !job.output_path) {
    return NextResponse.json({ error: "Tarjima qilingan PDF hali tayyor emas." }, { status: 409 });
  }

  const storage = getSupabaseStorage();
  const { data, error: signedError } = await storage.storage
    .from(BUCKET).createSignedUrl(job.output_path, 60 * 30);

  if (signedError || !data?.signedUrl) {
    return NextResponse.json({ error: "Download URL yaratilmadi." }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl, expiresIn: 1800 });
}
