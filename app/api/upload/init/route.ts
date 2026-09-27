import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const BUCKET = "manga-files";

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
      return NextResponse.json({ stage: "upload/init", error: "Faqat PDF fayl qabul qilinadi." }, { status: 400 });
    }

    if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_SIZE) {
      return NextResponse.json({ stage: "upload/init", error: "PDF hajmi 100 MB dan oshmasligi kerak." }, { status: 413 });
    }

    const jobId = crypto.randomUUID();
    const storagePath = `jobs/${jobId}/source/${safeFilename(filename)}`;

    return NextResponse.json({ ok: true, jobId, storagePath, bucket: BUCKET });
  } catch (error) {
    return NextResponse.json({
      stage: "upload/init",
      error: error instanceof Error ? error.message : "Upload boshlashda xato.",
    }, { status: 500 });
  }
}
