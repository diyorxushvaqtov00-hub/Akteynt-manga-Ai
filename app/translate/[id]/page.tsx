"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, AlertCircle, Download, BookOpen } from "lucide-react";

type Job = {
  id: string; filename: string; status: string; progress: number;
  currentPage: number; totalPages: number | null; error: string | null; updatedAt: string;
};

export default function TranslatePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);

  useEffect(() => {
    if (!id) return;
    let stopped = false;

    async function tick() {
      const response = await fetch("/api/jobs/" + id, { cache: "no-store" });
      if (response.ok && !stopped) setJob(await response.json());
    }

    tick();
    const timer = setInterval(tick, 2000);
    return () => { stopped = true; clearInterval(timer); };
  }, [id]);

  async function processNext() {
    if (!id || busy || job?.status === "completed") return;
    setBusy(true);
    try {
      await fetch("/api/jobs/" + id + "/process", { method: "POST" });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!job || busy || job.status === "completed" || job.status === "failed") return;
    processNext();
  }, [job?.currentPage, job?.status, job?.updatedAt]);

  async function download() {
    const response = await fetch("/api/jobs/" + id + "/download");
    const data = await response.json();
    if (data.url) window.location.href = data.url;
  }

  if (!job) return <main className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-purple-300" /></main>;

  return (
    <main className="min-h-screen px-5 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[.03] p-7">
        <div className="text-sm text-zinc-500">AKTEYNT AI • TRANSLATOR</div>
        <h1 className="mt-2 text-2xl font-bold">{job.filename}</h1>

        <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: job.progress + "%" }} />
        </div>

        <div className="mt-3 flex justify-between text-sm text-zinc-400">
          <span>{job.progress}%</span>
          <span>{job.currentPage} / {job.totalPages ?? "—"} sahifa</span>
        </div>

        <div className="mt-8 rounded-2xl border border-white/8 bg-black/20 p-5">
          {job.status === "completed" ? (
            <div className="flex items-center gap-3 text-emerald-300">
              <CheckCircle2 /> Tarjima tugadi.
            </div>
          ) : job.status === "failed" ? (
            <div className="text-red-300"><AlertCircle className="mr-2 inline" />{job.error}</div>
          ) : (
            <div className="flex items-center gap-3 text-zinc-300">
              <Loader2 className="animate-spin text-purple-300" /> {job.status}...
            </div>
          )}
        </div>

        {job.status === "completed" && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href={"/reader/" + id} className="flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500">
              <BookOpen size={18} /> Readerda o‘qish
            </Link>
            <button onClick={download} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 font-semibold hover:bg-white/10">
              <Download size={18} /> PDF'ni olish
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
