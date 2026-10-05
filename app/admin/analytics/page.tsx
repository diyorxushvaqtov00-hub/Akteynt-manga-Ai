import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, BarChart3, Database, ShieldCheck, Zap } from "lucide-react";

export default async function AnalyticsAdminPage() {
  const supabase=getSupabaseAdmin();
  const [jobs,mangas,chapters,users]=await Promise.all([
    supabase.from("translation_jobs").select("id,stage,progress,error,error_message,created_at"),
    supabase.from("mangas").select("id",{count:"exact",head:true}),
    supabase.from("chapters").select("id",{count:"exact",head:true}),
    supabase.from("profiles").select("id",{count:"exact",head:true})
  ]);
  const rows=jobs.data??[];
  const ready=rows.filter(j=>j.stage==="READY").length;
  const failed=rows.filter(j=>j.error||j.error_message).length;
  const running=rows.filter(j=>j.stage!=="READY"&&!j.error&&!j.error_message).length;
  return <main className="min-h-screen bg-[#08070d] text-zinc-100 p-5 md:p-8"><div className="mx-auto max-w-7xl">
    <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white"><ArrowLeft size={15}/> Admin Dashboard</Link>
    <p className="text-[10px] uppercase tracking-[.2em] text-violet-400">Platform intelligence</p><h1 className="mt-2 text-3xl font-black">Analytics</h1><p className="mt-1 text-sm text-zinc-500">Live localization pipeline statistics.</p>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
      ["Total jobs",rows.length,BarChart3],["Ready",ready,ShieldCheck],["Running",running,Zap],["Failed",failed,Database]
    ].map(([label,value,Icon])=>{const I=Icon as typeof BarChart3;return <div key={label as string} className="rounded-2xl border border-white/[.07] bg-[#0c0b12] p-5"><I size={17} className="text-violet-300"/><div className="mt-5 text-2xl font-black">{value as number}</div><div className="mt-1 text-xs text-zinc-500">{label as string}</div></div>})}</div>
    <section className="mt-6 rounded-2xl border border-white/[.07] bg-[#0c0b12] p-6"><h2 className="text-sm font-bold">Platform totals</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><div><div className="text-2xl font-black">{mangas.count??0}</div><div className="text-xs text-zinc-600">Manga</div></div><div><div className="text-2xl font-black">{chapters.count??0}</div><div className="text-xs text-zinc-600">Chapters</div></div><div><div className="text-2xl font-black">{users.count??0}</div><div className="text-xs text-zinc-600">Users</div></div></div></section>
  </div></main>;
}