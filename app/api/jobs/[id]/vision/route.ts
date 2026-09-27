import { NextResponse } from "next/server";
import { MANGA_VISION_PROMPT } from "@/lib/ai/prompts";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (!body.pageNumber) {
    return NextResponse.json({ error: "pageNumber kerak." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    jobId: id,
    pageNumber: body.pageNumber,
    status: "ready_for_vision",
    promptVersion: "v1",
    prompt: MANGA_VISION_PROMPT,
    blocks: [],
  });
}