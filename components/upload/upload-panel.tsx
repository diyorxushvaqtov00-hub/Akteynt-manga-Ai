"use client";

import { useState } from "react";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";


export function UploadPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function startUpload() {
    if (!file) return;
    setLoading(true);
    setMessage("");

    try {
      const initResponse = await fetch("/api/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          type: file.type,
        }),
      });

      const initText = await initResponse.text();
      let initData: { error?: string; jobId?: string; storagePath?: string; token?: string; signedUrl?: string } = {};
      try {
        initData = JSON.parse(initText);
      } catch {
        throw new Error(initText.slice(0, 240) || "Upload serveridan noto'g'ri javob keldi.");
      }

      if (!initResponse.ok || !initData.jobId || !initData.storagePath || !initData.token || !initData.signedUrl) {
        const stage = (initData as { stage?: string }).stage;
        const diagnostic = (initData as { diagnostic?: { supabaseHost?: string; protocol?: string; bucket?: string; hasToken?: boolean; hasSignedUrl?: boolean } }).diagnostic;
        throw new Error(
          [
            stage ? `Bosqich: ${stage}` : "Bosqich: upload/init",
            initData.error ?? "Upload boshlanmadi.",
            diagnostic?.supabaseHost ? `Supabase: ${diagnostic.supabaseHost}` : "",
            diagnostic?.bucket ? `Bucket: ${diagnostic.bucket}` : "",
            diagnostic ? `token=${diagnostic.hasToken ? "bor" : "yo'q"}, signedUrl=${diagnostic.hasSignedUrl ? "bor" : "yo'q"}` : "",
          ].filter(Boolean).join(" | "),
        );
      }

      // Supabase's official signed-upload flow uses PUT + multipart FormData
      // for browser File/Blob bodies. Keep the signed URL and token untouched.
      const uploadBody = new FormData();
      uploadBody.append("cacheControl", "3600");
      uploadBody.append("", file);

      const uploadResponse = await fetch(initData.signedUrl, {
        method: "PUT",
        headers: {
          "x-upsert": "false",
        },
        body: uploadBody,
      });

      if (!uploadResponse.ok) {
        const uploadText = await uploadResponse.text();
        let detail = uploadText;
        try {
          const parsed = JSON.parse(uploadText);
          detail = parsed.message ?? parsed.error ?? parsed.statusCode ?? uploadText;
        } catch {}
        throw new Error(
          `Bosqich: supabase-signed-upload | HTTP ${uploadResponse.status} | ${detail || "PDF Supabase Storage'ga yuklanmadi."}`,
        );
      }

      const finalizeResponse = await fetch("/api/upload/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: initData.jobId,
          filename: file.name,
          storagePath: initData.storagePath,
        }),
      });

      const finalizeText = await finalizeResponse.text();
      let finalizeData: { error?: string; job?: { id: string } } = {};
      try {
        finalizeData = JSON.parse(finalizeText);
      } catch {
        throw new Error(finalizeText.slice(0, 240) || "Upload yakunlash serveridan noto'g'ri javob keldi.");
      }

      if (!finalizeResponse.ok || !finalizeData.job) {
        throw new Error(finalizeData.error ?? "Upload yakunlanmadi.");
      }

      window.location.href = "/translate/" + finalizeData.job.id;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Noma'lum xato.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5 flex flex-col items-center gap-4">
      <label className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10">
        <Upload className="mr-2 inline-block" size={17} />
        PDF tanlash
        <input
          className="hidden"
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>

      {file && <p className="text-sm text-zinc-400">{file.name}</p>}

      <button
        onClick={startUpload}
        disabled={!file || loading}
        className="rounded-xl bg-purple-600 px-6 py-3 font-semibold disabled:opacity-30"
      >
        {loading ? <><Loader2 className="mr-2 inline animate-spin" size={17}/>Yuklanmoqda...</> : "PDF'ni yuklash"}
      </button>

      {message && (
        <p className="max-w-md text-center text-sm text-zinc-400">
          {message.includes("qabul qilindi")
            ? <><CheckCircle2 className="mr-1 inline text-emerald-400" size={16}/>{message}</>
            : <><AlertCircle className="mr-1 inline text-red-400" size={16}/>{message}</>}
        </p>
      )}
    </div>
  );
}
