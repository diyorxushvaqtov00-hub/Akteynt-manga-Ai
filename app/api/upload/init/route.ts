import { NextResponse } from "next/server";

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
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const secretKey = process.env.SUPABASE_SECRET_KEY || "";
    const legacyServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    const urlInfo = (() => {
      try {
        const parsed = new URL(supabaseUrl);
        return { host: parsed.host, protocol: parsed.protocol };
      } catch {
        return { host: "INVALID_URL", protocol: "INVALID" };
      }
    })();

    // Supabase's new sb_secret_* keys are opaque API keys, not JWTs.
    // The Storage signed-upload endpoint still requires a JWT-style
    // Authorization credential for this server-side operation. Prefer the
    // legacy service_role JWT when it is available; keep sb_secret_* on apikey.
    const authKey = legacyServiceRoleKey;
    const apiKey = secretKey || legacyServiceRoleKey;

    const keyParts = authKey.split(".");
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
      present: Boolean(authKey),
      segments: keyParts.length,
      role: keyRole,
      ref: keyRef,
      expectedRef,
      refMatchesUrl: Boolean(keyRef && expectedRef && keyRef === expectedRef),
      parseError: keyParseError,
    };

    if (!supabaseUrl || !apiKey) {
      return NextResponse.json({
        ok: false,
        stage: "signed-url-create",
        error: "Supabase URL yoki API key sozlanmagan.",
        diagnostic: {
          supabaseHost: urlInfo.host,
          protocol: urlInfo.protocol,
          bucket: BUCKET,
          hasToken: false,
          hasSignedUrl: false,
          keyDiagnostics,
        },
      }, { status: 500 });
    }

    if (!authKey || keyParts.length !== 3 || keyRole !== "service_role") {
      return NextResponse.json({
        ok: false,
        stage: "signed-url-create",
        error:
          "Supabase Storage signed upload uchun legacy service_role JWT kerak. Vercel Environment Variables ga SUPABASE_SERVICE_ROLE_KEY ni qo'shing. sb_secret_* kalitni SUPABASE_SECRET_KEY sifatida qoldiring.",
        diagnostic: {
          supabaseHost: urlInfo.host,
          protocol: urlInfo.protocol,
          bucket: BUCKET,
          hasToken: false,
          hasSignedUrl: false,
          keyDiagnostics,
          requiresLegacyServiceRoleJwt: true,
        },
      }, { status: 500 });
    }

    const signUrl =
      supabaseUrl +
      "/storage/v1/object/upload/sign/" +
      encodeURIComponent(BUCKET) +
      "/" +
      storagePath.split("/").map(encodeURIComponent).join("/");

    const signResponse = await fetch(signUrl, {
      method: "POST",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${authKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      cache: "no-store",
    });

    const signText = await signResponse.text();
    let signData: {
      token?: string;
      signedUrl?: string;
      signedURL?: string;
      message?: string;
      error?: string;
    } = {};

    try {
      signData = JSON.parse(signText);
    } catch {
      // Keep raw response for diagnostics.
    }

    const token = signData.token;
    const signedUrl = signData.signedUrl || signData.signedURL;

    if (!signResponse.ok || !token || !signedUrl) {
      console.error("[upload/init] signed URL creation failed", {
        stage: "signed-url-create",
        httpStatus: signResponse.status,
        supabaseHost: urlInfo.host,
        bucket: BUCKET,
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
          httpStatus: signResponse.status,
          response: signText.slice(0, 500),
        },
        error:
          signData.message ||
          signData.error ||
          signText.slice(0, 500) ||
          "Supabase signed upload URL yaratmadi.",
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
