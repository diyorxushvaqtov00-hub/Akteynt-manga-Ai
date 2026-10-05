import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, BookOpen, Plus } from "lucide-react";

export default async function MangaAdminPage() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("mangas").select("id,title,slug,status,content_type,is_published,updated_at").order("updated_at",{ascending:false});
  const mangas = data ?? [];
  return <main className="min-h-screen bg-[#08070d] text-zinc-100 p-5 md:p-8"><div className="mx-auto max-w-7xl">
    <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white"><ArrowLeft size={15}/> Admin Dashboard</Link>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] uppercase tracking-[.2em] text-violet-400">Content management</p><h1 className="mt-2 text-3xl font-black">Manga</h1><p className="mt-1 text-sm text-zinc-500">Manage titles and publication status.</p></div><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-bold"><Plus size={15}/> New manga</button></div>
    <section className="mt-7 overflow-hidden rounded-2xl border border-white/[.07] bg-[#0c0b12]">{error ? <div className="p-8 text-sm text-red-300">Could not load manga data.</div> : mangas.length===0 ? <div className="p-12 text-center text-sm text-zinc-600"><BookOpen className="mx-auto mb-3 opacity-50"/>No manga yet.</div> : <div className="divide-y divide-white/[.05]">{mangas.map(m=><div key={m.id} className="grid gap-3 p-5 md:grid-cols-[1fr_140px_140px_100px] md:items-center"><div><div className="font-semibold">{m.title}</div><div className="mt-1 text-[10px] text-zinc-600">{m.slug}</div></div><span className="text-xs text-zinc-500">{m.content_type}</span><span className="text-xs text-zinc-500">{m.status}</span><span className={m.is_published ? "text-[10px] font-bold text-emerald-400" : "text-[10px] font-bold text-zinc-600"}>{m.is_published ? "PUBLISHED" : "DRAFT"}</span></div>)}</div>}</section>
  </div></main>;
}