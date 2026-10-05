import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleAlert, Database, HardDrive, KeyRound } from "lucide-react";

export default async function SystemHealthPage() {
  let dbOk=false, storageOk=false, dbError="";
  try {
    const supabase=getSupabaseAdmin();
    const q=await supabase.from("translation_jobs").select("id").limit(1);
    dbOk=!q.error; dbError=q.error?.message||"";
    const s=await supabase.storage.listBuckets();
    storageOk=!s.error;
  } catch(e) { dbError=e instanceof Error?e.message:"Unknown error"; }
  const aiConfigured=Boolean(process.env.AI_GATEWAY_API_KEY);
  const items=[["Supabase Database",dbOk,Database],["Supabase Storage",storageOk,HardDrive],["AI Gateway key",aiConfigured,KeyRound]];
  return <main className="min-h-screen bg-[#08070d] text-zinc-100 p-5 md:p-8"><div className="mx-auto max-w-5xl">
    <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white"><ArrowLeft size={15}/> Admin Dashboard</Link>
    <p className="text-[10px] uppercase tracking-[.2em] text-violet-400">Operations</p><h1 className="mt-2 text-3xl font-black">System Health</h1><p className="mt-1 text-sm text-zinc-500">Server-side connectivity checks. Secrets are never displayed.</p>
    <section className="mt-7 space-y-3">{items.map(([label,ok,Icon])=>{const I=Icon as typeof Database;return <div key={label as string} className="flex items-center gap-4 rounded-2xl border border-white/[.07] bg-[#0c0b12] p-5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[.03]"><I size={18} className={(ok as boolean)?"text-emerald-400":"text-red-400"}/></div><div className="flex-1"><div className="text-sm font-semibold">{label as string}</div><div className="mt-1 text-[10px] text-zinc-600">{ok?"Connected / configured":"Unavailable / not configured"}</div></div>{(ok as boolean)?<CheckCircle2 className="text-emerald-400" size={18}/>:<CircleAlert className="text-red-400" size={18}/>}</div>})}</section>
    {!dbOk&&<div className="mt-4 rounded-xl border border-red-400/10 bg-red-400/5 p-4 text-xs text-red-300">{dbError||"Database check failed."}</div>}
  </div></main>