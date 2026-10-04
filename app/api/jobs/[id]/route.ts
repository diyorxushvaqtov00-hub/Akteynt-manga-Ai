import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: job, error } = await supabase
    .from("translation_jobs")
    .select("id,filename,status,stage,progress,current_page,total_pages,source_language,target_language,error,output_path,created_at,updated_at")
    .eq("id", id).single();

  if (error || !job) return NextResponse.json({ error: "Job topilmadi." }, { status: 404 });

  return NextResponse.json({
    id: job.id,
    filename: job.filename,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    currentPage: job.current_page,
    totalPages: job.total_pages,
    sourceLanguage: job.source_language,
    targetLanguage: job.target_language,
    error: job.error,
    outputPath: job.output_path,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  });
}
