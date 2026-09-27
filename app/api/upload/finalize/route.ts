import { NextResponse } from "next/server";

export const runtime = "nodejs";

const EDGE_URL = "https://mnbyaetebzfjtpyekcpg.supabase.co/functions/v1/manga-upload";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!key) return NextResponse.json({ stage: "job-insert", error: "Server Supabase key sozlanmagan." }, { status: 500 });

    const response = await fetch(EDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key },
      body: JSON.stringify({ action: "finalize", ...body }),
      cache: "no-store",
    });

    const text = await response.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { error: text.slice(0, 500) }; }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ stage: "job-insert", error: error instanceof Error ? error.message : "Uploadni yakunlashda xato." }, { status: 500 });
  }
}
