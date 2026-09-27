import { NextResponse } from "next/server";
import { getPdfExtractor } from "@/lib/pdf/extractor";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "PDF fayl yuborilmadi." }, { status: 400 });
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Faqat PDF qabul qilinadi." }, { status: 400 });
  }

  try {
    const pdf = new Uint8Array(await file.arrayBuffer());
    const extractor = getPdfExtractor();
    const totalPages = await extractor.countPages(pdf);

    return NextResponse.json({
      ok: true,
      jobId: id,
      status: "extracting",
      totalPages,
      message: "PDF sahifalarini ajratish uchun navbatga qo'yildi.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF extraction xatosi." },
      { status: 500 },
    );
  }
}