import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const supabaseUrl = process.env.SUPABASE_URL || "";
    const secretKey = process.env.SUPABASE_SECRET_KEY || "";

    if (!supabaseUrl || !secretKey) {
      return NextResponse.json(
        {
          ok: false,
          stage: "signed-url-create",
          error: "SUPABASE_URL yoki SUPABASE_SECRET_KEY sozlanmagan.",
        },
        { status: 500 },
      );
    }

    const urlInfo = (() => {
      try {
        const parsed = new URL(supabaseUrl);
        return { host: parsed.host, protocol: parsed.protocol };
      } catch {
        return { host: "INVALID_URL", protocol: "INVALID" };
      }
    })();

    // Supabase's modern sb_secret_* key is the supported server-side
    // replacement for the legacy service_role JWT. Let supabase-js handle
    // the Storage authentication instead of manually constructing a JWT
    // Authorization header.
    const supabase = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const jobId = crypto.randomUUID();
    const storagePath = `jobs/${jobId}/source/${safeFilename(filename)}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath, { upsert: false });

    if (error || !data?.token || !data?.signedUrl) {
      console.error("[upload/init] signed URL creation failed", {
        stage: "signed-url-create",
        supabaseHost: urlInfo.host,
        bucket: BUCKET,
        message: error?.message,
        name: error?.name,
      });

      return NextResponse.json(
        {
          ok: false,
          stage: "signed-url-create",
          error: error?.message || "Supabase signed upload URL yaratmadi.",
          diagnostic: {
            supabaseHost: urlInfo.host,
            protocol: urlInfo.protocol,
            bucket: BUCKET,
            hasToken: Boolean(data?.token),
            hasSignedUrl: Boolean(data?.signedUrl),
          },
        },
        { status: 502 },
      );
    }

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
