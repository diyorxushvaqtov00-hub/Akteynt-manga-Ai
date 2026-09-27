import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const jobId = typeof body?.jobId === "string" ? body.jobId : "";
    const filename = typeof body?.filename === "string" ? body.filename : "";
    const storagePath = typeof body?.storagePath === "string" ? body.storagePath : "";

    if (!jobId || !filename || !storagePath || !storagePath.startsWith(`jobs/${jobId}/source/`)) {
      return NextResponse.json({ stage: "job-insert", error: "Upload ma'lumotlari noto'g'ri." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: existing, error: existingError } = await supabase
      .from("translation_jobs")
      .select("id,filename,status,progress,current_page,total_pages")
      .eq("id", jobId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ stage: "job-check", error: existingError.message }, { status: 502 });
    }

    if (existing) {
      return NextResponse.json({
        ok: true,
        job: {
          id: existing.id,
          filename: existing.filename,
          status: existing.status,
          progress: existing.progress,
          currentPage: existing.current_page,
          totalPages: existing.total_pages,
        },
      });
    }

    const { data: job, error } = await supabase
      .from("translation_jobs")
      .insert({
        id: jobId,
        filename,
        status: "uploaded",
        progress: 0,
        current_page: 0,
        total_pages: null,
        source_language: "auto",
        target_language: "uz",
        source_path: storagePath,
      })
      .select("id,filename,status,progress,current_page,total_pages")
      .single();

    if (error) {
      return NextResponse.json({ stage: "job-insert", error: error.message }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      job: {
        id: job.id,
        filename: job.filename,
        status: job.status,
        progress: job.progress,
        currentPage: job.current_page,
        totalPages: job.total_pages,
      },
    });
  } catch (error) {
    return NextResponse.json({
      stage: "job-insert",
      error: error instanceof Error ? error.message : "Uploadni yakunlashda xato.",
    }, { status: 500 });
  }
}
