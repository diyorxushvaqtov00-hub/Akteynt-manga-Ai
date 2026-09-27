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
    // New sb_secret_* keys are not JWTs. Use the apikey header directly for Storage.
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    // Diagnostic metadata only: never expose the secret key or signed token.
    const serviceRoleKey = secretKey;
    const urlInfo = (() => {
      try {
        const parsed = new URL(supabaseUrl);
        return { host: parsed.host, protocol: parsed.protocol };
      } catch {
        return { host: "INVALID_URL", protocol: "INVALID" };
      }
    })();

    // Safe JWT diagnostics: expose only structure/claims, never the key itself.
    const keyParts = serviceRoleKey.split(".");
    let keyRole: string | null = null;
    let keyRef: string | null = null;
    let keyParseError: string | null = null;
    if (keyParts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(keyParts[1], "base64url").toString("utf8")) as {
          role?: unknown;
          ref?: unknown;
        };
        keyRole = typeof payload.role === "string" ? payload.role : null;
        keyRef = typeof payload.ref === "string" ? payload.ref : null;
      } catch {
        keyParseError = "JWT payload decode failed";
      }
    } else {
      keyParseError = "JWT must contain 3 segments";
    }
    const expectedRef = urlInfo.host.endsWith(".supabase.co")
      ? urlInfo.host.split(".")[0]
      : null;
    const keyDiagnostics = {
      present: Boolean(serviceRoleKey),
      length: serviceRoleKey.length,
      segments: keyParts.length,
      looksLikeJwt: keyParts.length === 3,
      role: keyRole,
      ref: keyRef,
      expectedRef,
      refMatchesUrl: Boolean(keyRef && expectedRef && keyRef === expectedRef),
      parseError: keyParseError,
    };

    const signUrl = supabaseUrl + "/storage/v1/object/upload/sign/" + encodeURI(storagePath);
    const signResponse = await fetch(signUrl, {
      method: "POST",
      headers: {
        apikey: secretKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const signText = await signResponse.text();
    let signData: { token?: string; signedURL?: string; signedUrl?: string; path?: string; message?: string; error?: string } = {};
    try {
      signData = JSON.parse(signText);
    } catch {
      signData = {};
    }
    const token = signData.token;
    const signedUrl = signData.signedUrl || signData.signedURL;

    if (!signResponse.ok || !token || !signedUrl) {
      console.error("[upload/init] signed URL creation failed", {
        stage: "signed-url-create",
        supabaseHost: urlInfo.host,
        protocol: urlInfo.protocol,
        bucket: BUCKET,
        storagePath,
        httpStatus: signResponse.status,
        hasToken: Boolean(token),
        hasSignedUrl: Boolean(signedUrl),
        response: signText.slice(0, 500),
      });

      return NextResponse.json({
        ok: false,
        stage: "signed-url-create",
        diagnostic: {
          supabaseHost: urlInfo.host,
          protocol: urlInfo.protocol,
          bucket: BUCKET,
          hasToken: Boolean(token),
          hasSignedUrl: Boolean(signedUrl),
          keyDiagnostics,
        },
        error: signData.message || signData.error || signText.slice(0, 500) || "Supabase signed upload URL yaratmadi.",
      }, { status: 502 });
    }

    console.info("[upload/init] signed URL created", {
      stage: "signed-url-create",
      supabaseHost: urlInfo.host,
      protocol: urlInfo.protocol,
      bucket: BUCKET,
      hasToken: true,
      hasSignedUrl: true,
    });

    return NextResponse.json({
      ok: true,
      jobId,
      storagePath,
      token,
      signedUrl,
      bucket: BUCKET,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload boshlashda xato." },
      { status: 500 },
    );
  }
}
