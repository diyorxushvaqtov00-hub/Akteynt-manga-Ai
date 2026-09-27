import { NextResponse } from "next/server";

type JobStatus = "uploaded" | "processing" | "completed" | "failed";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return NextResponse.json({
    id,
    status: "uploaded" satisfies JobStatus,
    progress: 0,
    currentPage: 0,
    totalPages: null,
    message: "Job qabul qilindi. PDF processing navbatiga tayyor.",
  });
}