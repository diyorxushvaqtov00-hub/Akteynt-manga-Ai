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
      let initData: { error?: string; jobId?: string; storagePath?: string; token?: string; supabaseUrl?: string } = {};
      try {
        initData = JSON.parse(initText);
      } catch {
        throw new Error(initText.slice(0, 240) || "Upload serveridan noto'g'ri javob keldi.");
      }

      if (!initResponse.ok || !initData.jobId || !initData.storagePath || !initData.token || !initData.supabaseUrl) {
        throw new Error(initData.error ?? "Upload boshlanmadi.");
      }

      const uploadUrl = new URL(
        `/storage/v1/object/upload/sign/${initData.storagePath}`,
        initData.supabaseUrl,
      );
      uploadUrl.searchParams.set("token", initData.token);

      const uploadResponse = await fetch(uploadUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/pdf", "x-upsert": "false" },
        body: file,
      });

      if (!uploadResponse.ok) {
        const uploadText = await uploadResponse.text();
        throw new Error(uploadText || "PDF Supabase Storage'ga yuklanmadi.");
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
