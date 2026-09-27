import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "manga-files";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) return NextResponse.json({ error: "PDF fayl topilmadi." }, { status: 400 });
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "Faqat PDF fayl qabul qilinadi." }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "Fayl bo'sh." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "PDF hajmi 100 MB dan oshmasligi kerak." }, { status: 413 });

  const jobId = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = \`jobs/\${jobId}/source/\${safeName}\`;

  try {
    const supabase = getSupabaseAdmin();
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase.from("translation_jobs").insert({
      id: jobId, filename: file.name, status: "uploaded", progress: 0,
      current_page: 0, total_pages: null, source_language: "auto", target_language: "uz",
    });

    if (dbError) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      throw dbError;
    }

    return NextResponse.json({
      ok: true,
      job: { id: jobId, filename: file.name, size: file.size, status: "uploaded",
        progress: 0, currentPage: 0, totalPages: null, storagePath },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload saqlashda xato." },
      { status: 500 },
    );
  }
}
