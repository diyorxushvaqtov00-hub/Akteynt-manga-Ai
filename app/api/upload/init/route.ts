import { NextResponse } from "next/server";
import { getSupabaseStorage } from "@/lib/supabase-storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "manga-files";

function safeFilename(name: string) {
  const normalized = name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g, "_");
  return normalized.slice(0, 160) || "chapter.pdf";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const filename = typeof body?.filename === "string" ? body.filename : "";
    const size = Number(body?.size);
    const type = typeof body?.type === "string" ? body.type : "";

    if (!filename.toLowerCase().endsWith(".pdf") && type !== "application/pdf") {
      return NextResponse.json({ error: "Faqat PDF fayl qabul qilinadi." }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ error: "Fayl hajmi noto'g'ri." }, { status: 400 });
    }
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "PDF hajmi 100 MB dan oshmasligi kerak." }, { status: 413 });
    }

    const jobId = crypto.randomUUID();
    const storagePath = `jobs/${jobId}/source/${safeFilename(filename)}`;
    const supabase = getSupabaseStorage();

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath, { upsert: false });

    if (error || !data?.token || !data?.signedUrl) {
      console.error("[upload/init] signed URL creation failed", {
        stage: "signed-url-create",
        bucket: BUCKET,
        message: error?.message,
        name: error?.name,
      });

      return NextResponse.json(
        {
          ok: false,
          stage: "signed-url-create",
          error: error?.message || "Supabase signed upload URL yaratmadi.",
          diagnostic: {
            bucket: BUCKET,
            hasToken: Boolean(data?.token),
            hasSignedUrl: Boolean(data?.signedUrl),
          },
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      jobId,
      storagePath,
      token: data.token,
      signedUrl: data.signedUrl,
      bucket: BUCKET,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload boshlashda xato." },
      { status: 500 },
    );
  }
}
