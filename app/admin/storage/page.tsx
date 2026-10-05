import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, HardDrive, FileBox } from "lucide-react";

export default async function StorageAdminPage() {
  const supabase=getSupabaseAdmin();
  const {data,error}=await supabase.storage.listBuckets();
  const buckets=data??[];
  return <main className="min-h-screen bg-[#08070d] text-zinc-100 p-5 md:p-8"><div className="mx-auto max-w-5xl">
    <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white"><ArrowLeft size={15}/> Admin Dashboard</Link>
    <p className="text-[10px] uppercase tracking-[.2em] text-violet-400">Infrastructure</p><h1 className="mt-2 text-3xl font-black">Storage</h1><p className="mt-1 text-sm text-zinc-500">Supabase Storage buckets visible to the server.</p>
    <section className="mt-7 overflow-hidden rounded-2xl border border-white/[.07] bg-[#0c0b12]">{error?<div className="p-8 text-sm text-red-300">Could not read storage buckets.</div>:buckets.length===0?<div className="p-12 text-center text-sm text-zinc-600"><HardDrive className="mx-auto mb-3 opacity-50"/>No buckets found.</div>:<div className="divide-y divide-white/[.05]">{buckets.map(b=><div key={b.id} className="flex items-center gap-4 p-5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-300"><FileBox size={17}/></div><div className="flex-1"><div className="text-sm font-semibold">{b.name}</div><div className="mt-1 text-[10px] text-zinc-600">{b.public?"Public bucket":"Private bucket"}</div></div></div>)}</div>}</section>
  </div></main>