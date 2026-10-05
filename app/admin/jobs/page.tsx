import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { Activity, ArrowLeft, CheckCircle2, CircleAlert, Clock3 } from "lucide-react";

export default async function JobsAdminPage() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("translation_jobs").select("id,filename,progress,stage,error,error_message,updated_at,created_at").order("updated_at",{ascending:false}).limit(50);
  const jobs = data ?? [];
  return <main className="min-h-screen bg-[#08070d] text-zinc-100 p-5 md:p-8"><div className="mx-auto max-w-7xl">
    <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white"><ArrowLeft size={15}/> Admin Dashboard</Link>
    <p className="text-[10px] uppercase tracking-[.2em] text-violet-400">Operations</p><h1 className="mt-2 text-3xl font-black">AI Processing Jobs</h1><p className="mt-1 text-sm text-zinc-500">Monitor translation pipeline runs.</p>
    <section className="mt-7 overflow-hidden rounded-2xl border border-white/[.07] bg-[#0c0b12]">{error ? <div className="p-8 text-sm text-red-300">Could not load jobs.</div> : jobs.length===0 ? <div className="p-12 text-center text-sm text-zinc-600">No processing jobs yet.</div> : <div className="divide-y divide-white/[.05]">{jobs.map(j=><div key={j.id} className="grid gap-4 p-5 md:grid-cols-[1fr_140px_1fr_110px] md:items-center"><div><div className="truncate text-xs font-semibold">{j.filename || "Untitled job"}</div><div className="mt-1 text-[9px] text-zinc-700">{j.id}</div></div><div className="flex items-center gap-2 text-[10px] text-violet-300"><Activity size={13}/>{j.stage}</div><div><div className="mb-1 flex justify-between text-[9px] text-zinc-600"><span>Progress</span><span>{j.progress ?? 0}%</span></div><div className="h-1.5 rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-violet-500" style={{width: `${Math.max(0, Math.min(100, j.progress ?? 0))}%`}} /></div></div><div className="flex items-center gap-2 text-[10px]">{j.error || j.error_message ? <><CircleAlert size={13} className="text-red-400"/><span className="text-red-300">FAILED</span></> : j.stage === "READY" ? <><CheckCircle2 size={13} className="text-emerald-400"/><span className="text-emerald-300">READY</span></> : <><Clock3 size={13} className="text-amber-400"/><span className="text-amber-300">RUNNING</span></>}</div></div>)}</div>}</section>
  </div></main>;
}