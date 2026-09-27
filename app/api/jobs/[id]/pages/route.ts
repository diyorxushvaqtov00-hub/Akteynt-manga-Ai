import { NextResponse } from "next/server";
import { createPageRecords, calculateProgress, type MangaPage } from "@/lib/pdf/pipeline";

const jobs = new Map<string, MangaPage[]>();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const totalPages = Number(body.totalPages);

  if (!Number.isInteger(totalPages) || totalPages < 1 || totalPages > 200) {
    return NextResponse.json(
      { error: "Sahifalar soni 1–200 oralig'ida bo'lishi kerak." },
      { status: 400 },
    );
  }

  const pages = createPageRecords(id, totalPages);
  jobs.set(id, pages);

  return NextResponse.json({
    ok: true,
    jobId: id,
    totalPages,
    progress: calculateProgress(pages),
    pages,
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pages = jobs.get(id) ?? [];

  return NextResponse.json({
    jobId: id,
    totalPages: pages.length,
    progress: calculateProgress(pages),
    pages,
  });
}