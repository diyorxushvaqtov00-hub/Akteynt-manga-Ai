import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("manga_pages")
    .select("id,page_number,status,original_image_path,translated_image_path,error")
    .eq("job_id", id)
    .order("page_number", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = data.length;
  const completed = data.filter((p) => p.status === "translated").length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  return NextResponse.json({
    jobId: id,
    totalPages: total,
    completedPages: completed,
    progress,
    pages: data,
  });
}
