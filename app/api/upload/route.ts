import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "PDF fayl topilmadi." }, { status: 400 });
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Faqat PDF fayl qabul qilinadi." }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "Fayl bo'sh." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "PDF hajmi 100 MB dan oshmasligi kerak." },
      { status: 413 },
    );
  }

  const jobId = crypto.randomUUID();

  return NextResponse.json({
    ok: true,
    job: {
      id: jobId,
      filename: file.name,
      size: file.size,
      status: "uploaded",
      progress: 0,
      currentPage: 0,
      totalPages: null,
    },
  });
}