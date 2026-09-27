import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const totalPages = Number(body.totalPages ?? 0);
  const currentPage = Number(body.currentPage ?? 0);

  const progress =
    totalPages > 0
      ? Math.min(100, Math.max(0, Math.round((currentPage / totalPages) * 100)))
      : 0;

  return NextResponse.json({
    jobId: id,
    currentPage,
    totalPages,
    progress,
    status: progress >= 100 ? "completed" : "processing",
  });
}