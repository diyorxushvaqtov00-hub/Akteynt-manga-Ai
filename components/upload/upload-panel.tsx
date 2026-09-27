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

    const body = new FormData();
    body.append("file", file);

    try {
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Upload xatosi.");

      window.location.href = "/translate/" + data.job.id;
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