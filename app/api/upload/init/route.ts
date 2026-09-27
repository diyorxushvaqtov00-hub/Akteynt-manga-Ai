import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "manga-files";

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
      return NextResponse.json({ error: "Faqat PDF fayl qabul qilinadi." }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ error: "Fayl hajmi noto'g'ri." }, { status: 400 });
    }
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "PDF hajmi 100 MB dan oshmasligi kerak." }, { status: 413 });
    }

    const jobId = crypto.randomUUID();
    const storagePath = `jobs/${jobId}/source/${safeFilename(filename)}`;
    const supabase = getSupabaseAdmin();

    // Diagnostic metadata only: never expose the service-role key or signed token.
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const urlInfo = (() => {
      try {
        const parsed = new URL(supabaseUrl);
        return { host: parsed.host, protocol: parsed.protocol };
      } catch {
        return { host: "INVALID_URL", protocol: "INVALID" };
      }
    })();

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath);

    if (error || !data?.token) {
      console.error("[upload/init] signed URL creation failed", {
        stage: "signed-url-create",
        supabaseHost: urlInfo.host,
        protocol: urlInfo.protocol,
        bucket: BUCKET,
        storagePath,
        hasData: Boolean(data),
        hasToken: Boolean(data?.token),
        hasSignedUrl: Boolean(data?.signedUrl),
        error: error?.message ?? null,
        errorName: error?.name ?? null,
      });

      return NextResponse.json({
        ok: false,
        stage: "signed-url-create",
        diagnostic: {
          supabaseHost: urlInfo.host,
          protocol: urlInfo.protocol,
          bucket: BUCKET,
          hasToken: Boolean(data?.token),
          hasSignedUrl: Boolean(data?.signedUrl),
        },
        error: error?.message ?? "Supabase signed upload URL yaratmadi.",
      }, { status: 502 });
    }

    console.info("[upload/init] signed URL created", {
      stage: "signed-url-create",
      supabaseHost: urlInfo.host,
      protocol: urlInfo.protocol,
      bucket: BUCKET,
      hasToken: true,
      hasSignedUrl: Boolean(data.signedUrl),
    });

    return NextResponse.json({
      ok: true,
      jobId,
      storagePath,
      token: data.token,
      signedUrl: data.signedUrl,
      bucket: BUCKET,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload boshlashda xato." },
      { status: 500 },
    );
  }
}
