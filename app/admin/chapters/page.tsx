import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default async function ChaptersAdminPage() {
  const supabase=getSupabaseAdmin();
  const {data,error}=await supabase.from("chapters").select("id,manga_id,chapter_number,title,slug,is_published,published_at,updated_at").order("updated_at",{ascending:false}).limit(100);
  const chapters=data??[];
  return <main className="min-h-screen bg-[#08070d] text-zinc-100 p-5 md:p-8"><div className="mx-auto max-w-7xl">
    <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white"><ArrowLeft size={15}/> Admin Dashboard</Link>
    <p className="text-[10px] uppercase tracking-[.2em] text-violet-400">Content management</p><h1 className="mt-2 text-3xl font-black">Chapters</h1><p className="mt-1 text-sm text-zinc-500">Live chapter records from Supabase.</p>
    <section className="mt-7 overflow-hidden rounded-2xl border border-white/[.07] bg-[#0c0b12]">{error?<div className="p-8 text-sm text-red-300">Could not load chapters.</div>:chapters.length===0?<div className="p-12 text-center text-sm text-zinc-600"><FileText className="mx-auto mb-3 opacity-50"/>No chapters yet.</div>:<div className="divide-y divide-white/[.05]">{chapters.map(c=><div key={c.id} className="grid gap-3 p-5 md:grid-cols-[1fr_150px_130px_100px] md:items-center"><div><div className="font-semibold">{c.title||`Chapter ${c.chapter_number}`}</div><div className="mt-1 text-[10px] text-zinc-600">{c.slug||c.id}</div></div><span className="text-xs text-zinc-500">Manga: {c.manga_id}</span><span className="text-xs text-zinc-500">#{c.chapter_number}</span><span className={c.is_published?"text-[10px] font-bold text-emerald-400":"text-[10px] font-bold text-zinc-600"}>{c.is_published?"PUBLISHED":"DRAFT"}</span></div>)}</div>}</section>
  </div></main>;
}