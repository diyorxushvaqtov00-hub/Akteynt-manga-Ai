"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";

type Job = {
  filename: string;
  status: string;
  totalPages: number | null;
};

export default function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [page, setPage] = useState(1);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch("/api/jobs/" + id, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        setJob(data);
        if (data?.totalPages) setPage((current) => Math.min(current, data.totalPages));
      });
  }, [id]);

  useEffect(() => {
    if (!id || !job || job.status !== "completed") return;
    setLoading(true);
    fetch("/api/jobs/" + id + "/page-image?page=" + page + "&translated=true", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setUrl(data?.url ?? ""))
      .finally(() => setLoading(false));
  }, [id, page, job]);

  if (!job) return <main className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-purple-300" /></main>;

  const total = job.totalPages ?? 0;
  const canPrev = page > 1;
  const canNext = page < total;

  return (
    <main className="min-h-screen bg-black px-3 py-5 text-white md:px-6">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="min-w-0">
          <div className="text-xs text-purple-300">AKTEYNT AI • READER</div>
          <h1 className="truncate font-semibold">{job.filename}</h1>
        </div>
        <a href={"/api/jobs/" + id + "/download"} className="hidden items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 sm:flex">
          <Download size={16} /> PDF
        </a>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col items-center py-5">
        <div className="mb-4 text-sm text-zinc-400">Sahifa {page} / {total}</div>
        <div className="min-h-[60vh] w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
          {loading ? (
            <div className="grid min-h-[60vh] place-items-center"><Loader2 className="animate-spin text-purple-300" /></div>
          ) : url ? (
            <img src={url} alt={`Tarjima qilingan sahifa ${page}`} className="mx-auto block h-auto max-h-[80vh] w-auto max-w-full object-contain" />
          ) : (
            <div className="grid min-h-[60vh] place-items-center text-zinc-500">Sahifani yuklab bo‘lmadi.</div>
          )}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button disabled={!canPrev} onClick={() => setPage((p) => p - 1)} className="rounded-xl border border-white/10 px-4 py-3 disabled:cursor-not-allowed disabled:opacity-30 hover:bg-white/10">
            <ChevronLeft />
          </button>
          <span className="min-w-20 text-center text-sm text-zinc-400">{page} / {total}</span>
          <button disabled={!canNext} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-white/10 px-4 py-3 disabled:cursor-not-allowed disabled:opacity-30 hover:bg-white/10">
            <ChevronRight />
          </button>
        </div>
      </section>
    </main>
  );
}
