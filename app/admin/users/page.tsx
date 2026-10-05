import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, UserRound } from "lucide-react";

export default async function UsersAdminPage() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("profiles").select("id,username,display_name,role,created_at").order("created_at",{ascending:false});
  const users = data ?? [];
  return <main className="min-h-screen bg-[#08070d] text-zinc-100 p-5 md:p-8"><div className="mx-auto max-w-7xl">
    <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white"><ArrowLeft size={15}/> Admin Dashboard</Link>
    <p className="text-[10px] uppercase tracking-[.2em] text-violet-400">Access control</p><h1 className="mt-2 text-3xl font-black">Users</h1><p className="mt-1 text-sm text-zinc-500">Manage platform accounts and roles.</p>
    <section className="mt-7 overflow-hidden rounded-2xl border border-white/[.07] bg-[#0c0b12]">{error ? <div className="p-8 text-sm text-red-300">Could not load users.</div> : users.length===0 ? <div className="p-12 text-center text-sm text-zinc-600">No registered users yet.</div> : users.map(u=><div key={u.id} className="flex items-center gap-4 border-b border-white/[.05] p-5"><div className="grid h-10 w-10 place-items-center rounded-full bg-violet-500/10 text-violet-300"><UserRound size={17}/></div><div className="min-w-0 flex-1"><div className="text-xs font-semibold">{u.display_name || u.username || "Unnamed user"}</div><div className="mt-1 text-[9px] text-zinc-600">{u.username || u.id}</div></div><div className="flex items-center gap-2 text-[10px] text-zinc-400"><ShieldCheck size={13}/>{u.role}</div></div>)}</section>
  </div></main>;
}