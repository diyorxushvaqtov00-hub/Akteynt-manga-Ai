import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getVisionProvider } from "@/lib/ai/provider";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const pageNumber = Number(body.pageNumber);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return NextResponse.json({ error: "pageNumber noto'g'ri." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: page, error: pageError } = await supabase
    .from("manga_pages").select("id").eq("job_id", id).eq("page_number", pageNumber).single();

  if (pageError || !page) return NextResponse.json({ error: "Sahifa topilmadi." }, { status: 404 });

  const { data: blocks, error: blockError } = await supabase
    .from("text_blocks")
    .select("id,source_text,x,y,width,height,confidence,status")
    .eq("page_id", page.id)
    .order("created_at", { ascending: true });

  if (blockError) return NextResponse.json({ error: blockError.message }, { status: 500 });
  if (!blocks.length) return NextResponse.json({ error: "Tarjima qilinadigan matn topilmadi." }, { status: 400 });

  try {
    const provider = getVisionProvider();
    const translated = [];

    for (const block of blocks) {
      if (block.status === "translated" && block.translated_text) {
        translated.push(block);
        continue;
      }

      const text = await provider.translate(block.source_text);
      const { error } = await supabase.from("text_blocks").update({
        translated_text: text,
        status: "translated",
      }).eq("id", block.id);
      if (error) throw error;

      translated.push({ ...block, translated_text: text, status: "translated" });
    }

    await supabase.from("manga_pages").update({ status: "translated", error: null }).eq("id", page.id);

    return NextResponse.json({
      ok: true, jobId: id, pageNumber, status: "translated",
      blocks: translated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tarjima xatosi.";
    await supabase.from("manga_pages").update({ status: "failed", error: message }).eq("id", page.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
