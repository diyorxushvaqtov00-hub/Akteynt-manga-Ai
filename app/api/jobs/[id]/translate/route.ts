import { NextResponse } from "next/server";
import { UZBEK_TRANSLATION_PROMPT } from "@/lib/ai/prompts";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (!body.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "Tarjima qilinadigan matn kerak." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    jobId: id,
    sourceLanguage: body.sourceLanguage ?? "auto",
    targetLanguage: "uz",
    status: "ready_for_ai",
    promptVersion: "v1",
    prompt: UZBEK_TRANSLATION_PROMPT,
  });
}