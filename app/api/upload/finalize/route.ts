import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "manga-files";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const jobId = typeof body?.jobId === "string" ? body.jobId : "";
    const filename = typeof body?.filename === "string" ? body.filename : "";
    const storagePath = typeof body?.storagePath === "string" ? body.storagePath : "";

    if (!jobId || !filename || !storagePath || !storagePath.startsWith(`jobs/${jobId}/source/`)) {
      return NextResponse.json({ error: "Upload ma'lumotlari noto'g'ri." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("translation_jobs").insert({
      id: jobId,
      filename,
      status: "uploaded",
      progress: 0,
      current_page: 0,
      total_pages: null,
      source_language: "auto",
      target_language: "uz",
      source_path: storagePath,
    });

    if (error) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      throw error;
    }

    return NextResponse.json({
      ok: true,
      job: {
        id: jobId,
        filename,
        status: "uploaded",
        progress: 0,
        currentPage: 0,
        totalPages: null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Uploadni yakunlashda xato." },
      { status: 500 },
    );
  }
}
