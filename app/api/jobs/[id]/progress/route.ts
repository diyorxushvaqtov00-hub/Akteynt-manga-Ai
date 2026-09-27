import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: job, error } = await supabase
    .from("translation_jobs")
    .select("id,status,progress,current_page,total_pages,error,updated_at")
    .eq("id", id)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job topilmadi." }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    currentPage: job.current_page,
    totalPages: job.total_pages,
    error: job.error,
    updatedAt: job.updated_at,
  });
}
