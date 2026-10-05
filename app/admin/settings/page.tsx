import Link from "next/link";
import { ArrowLeft, Settings2 } from "lucide-react";

export default function SettingsAdminPage() {
  const items=[["AI Gateway","Configured server-side key required for model routing."],["Supabase","Database and Storage are accessed server-side."],["Pipeline","Stage order is enforced before export."]];
  return <main className="min-h-screen bg-[#08070d] text-zinc-100 p-5 md:p-8"><div className="mx-auto max-w-5xl">
    <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white"><ArrowLeft size={15}/> Admin Dashboard</Link>
    <p className="text-[10px] uppercase tracking-[.2em] text-violet-400">Configuration</p><h1 className="mt-2 text-3xl font-black">Settings</h1><p className="mt-1 text-sm text-zinc-500">Safe overview of platform configuration.</p>
    <section className="mt-7 space-y-3">{items.map(([a,b])=><div key={a} className="flex items-start gap-4 rounded-2xl border border-white/[.07] bg-[#0c0b12] p-5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-300"><Settings2 size={17}/></div><div><div className="text-sm font-semibold">{a}</div><div className="mt-1 text-xs text-zinc-500">{b}</div></div></div>)}</section>
  </div></main>