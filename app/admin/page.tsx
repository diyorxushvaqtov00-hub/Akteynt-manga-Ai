import { getSupabaseAdmin } from "@/lib/supabase";
import { Activity, BarChart3, BookOpen, CheckCircle2, ChevronDown, Clock3, Database, FileText, LayoutDashboard, Menu, MoreHorizontal, Search, Settings, ShieldCheck, Sparkles, UploadCloud, Users, Zap, AlertTriangle, Cpu, HardDrive } from "lucide-react";

const projects = [
  { title: "Shadow Blade", chapter: "Chapter 42", cover: "SB", progress: 100, stage: "READY", updated: "2 min ago", tone: "violet" },
  { title: "Haimiya Senpai Forever", chapter: "Chapter 1", cover: "HS", progress: 72, stage: "CLEANING", updated: "8 min ago", tone: "fuchsia" },
  { title: "The Beginning After the End", chapter: "Chapter 19", cover: "TB", progress: 100, stage: "READY", updated: "21 min ago", tone: "indigo" },
  { title: "Omniscient Reader", chapter: "Chapter 18", cover: "OR", progress: 46, stage: "TRANSLATING", updated: "34 min ago", tone: "purple" },
];

const activity = [
  ["success", "Chapter 42 translation completed", "just now"],
  ["success", "OCR completed for Chapter 18", "2 min ago"],
  ["process", "AI cleaning processing page 12", "5 min ago"],
  ["warning", "Cleaning QA requires review", "8 min ago"],
  ["success", "PDF export completed", "12 min ago"],
];

function Status({ children }: { children: string }) {
  const map: Record<string,string> = {
    READY: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    CLEANING: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    TRANSLATING: "border-purple-400/20 bg-purple-400/10 text-purple-300",
  };
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[.12em] ${map[children] ?? "border-white/10 bg-white/5 text-zinc-400"}`}>{children}</span>;
}

export default async function AdminDashboard() {
  const supabase = getSupabaseAdmin();
  const [mangas, chapters, users, jobs, readyJobs, failedJobs] = await Promise.all([
    supabase.from("mangas").select("*", { count: "exact", head: true }),
    supabase.from("chapters").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("translation_jobs").select("id,filename,progress,stage,status,error,error_message,updated_at,created_at").order("updated_at", { ascending: false }).limit(8),
    supabase.from("translation_jobs").select("*", { count: "exact", head: true }).eq("stage", "READY"),
    supabase.from("translation_jobs").select("*", { count: "exact", head: true }).or("error.not.is.null,error_message.not.is.null"),
  ]);
  const jobRows = jobs.data ?? [];
  const kpis = { mangas: mangas.count ?? 0, chapters: chapters.count ?? 0, users: users.count ?? 0, active: jobRows.filter((j:any)=>j.stage !== "READY" && !j.error && !j.error_message).length, ready: readyJobs.count ?? 0, failed: failedJobs.count ?? 0 };
  return (
    <main className="min-h-screen bg-[#08070d] text-zinc-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-[250px] shrink-0 border-r border-white/[.06] bg-[#0b0a11] px-4 py-5 lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 ring-1 ring-violet-400/25"><Sparkles size={19} className="text-violet-300"/></div>
            <div><div className="text-sm font-black tracking-[.16em]">AKTEYNT</div><div className="text-[9px] tracking-[.22em] text-zinc-600">MANGA AI</div></div>
          </div>
          <div className="mb-3 px-2 text-[9px] font-bold uppercase tracking-[.2em] text-zinc-600">Workspace</div>
          <nav className="space-y-1">
            {[[LayoutDashboard,"Dashboard",true],[BookOpen,"Manga"],[FileText,"Chapters"],[Zap,"AI Translation"],[Activity,"Processing Jobs"]].map(([Icon,label,active]) => {
              const I=Icon as typeof LayoutDashboard; return <a key={label as string} href="#" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active ? "bg-violet-500/10 text-white ring-1 ring-violet-400/10" : "text-zinc-500 hover:bg-white/[.03] hover:text-zinc-200"}`}><I size={17}/><span>{label as string}</span>{label==="Processing Jobs" && <span className="ml-auto rounded-full bg-violet-500/15 px-2 py-0.5 text-[9px] text-violet-300">27</span>}</a>
            })}
          </nav>
          <div className="mb-3 mt-8 px-2 text-[9px] font-bold uppercase tracking-[.2em] text-zinc-600">System</div>
          <nav className="space-y-1">
            {[[Users,"Users"],[BarChart3,"Analytics"],[HardDrive,"Storage"],[ShieldCheck,"System Health"],[Settings,"Settings"]].map(([Icon,label]) => {const I=Icon as typeof Users; return <a key={label as string} href="#" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 hover:bg-white/[.03] hover:text-zinc-200"><I size={17}/><span>{label as string}</span></a>})}
          </nav>
          <div className="mt-auto rounded-2xl border border-white/[.06] bg-white/[.025] p-3">
            <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-black">D</div><div className="min-w-0"><div className="truncate text-xs font-semibold">Diyor</div><div className="flex items-center gap-1 text-[10px] text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> Online</div></div><MoreHorizontal size={15} className="ml-auto text-zinc-600"/></div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-[70px] items-center gap-4 border-b border-white/[.06] px-5 md:px-8">
            <button className="rounded-lg p-2 text-zinc-500 lg:hidden"><Menu size={20}/></button>
            <div className="relative hidden max-w-md flex-1 md:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16}/><input placeholder="Search manga, chapters, users..." className="h-10 w-full rounded-xl border border-white/[.07] bg-white/[.025] pl-10 pr-4 text-xs outline-none placeholder:text-zinc-700 focus:border-violet-500/30"/></div>
            <div className="ml-auto flex items-center gap-3"><div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-1.5 text-[10px] text-emerald-300 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> All systems operational</div><button className="relative rounded-xl border border-white/[.07] bg-white/[.025] p-2.5 text-zinc-500"><Activity size={17}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-400"/></button></div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-6 p-5 md:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-violet-400"><span className="h-px w-5 bg-violet-500"/> Admin Console</div><h1 className="text-3xl font-black tracking-tight md:text-4xl">Good morning, Diyor.</h1><p className="mt-1 text-sm text-zinc-500">Monitor your manga localization platform.</p></div>
              <button className="flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_30px_rgba(139,92,246,.18)] hover:bg-violet-400"><UploadCloud size={15}/> New project</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[[BookOpen,"Total Manga","1,284","+12.4%","from-violet-500/20"],[CheckCircle2,"Translated Chapters","8,492","+8.7%","from-emerald-500/10"],[Zap,"Active AI Jobs","27","+4.2%","from-fuchsia-500/10"],[Users,"Users","18,642","+18.1%","from-indigo-500/10"]].map(([Icon,label,value,change,bg])=>{const I=Icon as typeof BookOpen;return <div key={label as string} className={`relative overflow-hidden rounded-2xl border border-white/[.07] bg-gradient-to-br ${bg as string} to-white/[.015] p-5`}><div className="flex items-center justify-between"><div className="grid h-9 w-9 place-items-center rounded-xl border border-white/[.06] bg-black/20 text-violet-300"><I size={17}/></div><span className="text-[10px] font-semibold text-emerald-400">{change as string}</span></div><div className="mt-5 text-2xl font-black tracking-tight">{value as string}</div><div className="mt-1 text-xs text-zinc-500">{label as string}</div><div className="absolute -bottom-8 -right-5 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl"/></div>})}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
              <div className="space-y-6">
                <section className="rounded-2xl border border-white/[.07] bg-[#0c0b12] p-5 md:p-6">
                  <div className="flex items-center justify-between"><div><h2 className="text-sm font-bold">AI Translation Pipeline</h2><p className="mt-1 text-[11px] text-zinc-600">Live processing flow</p></div><span className="flex items-center gap-2 text-[10px] text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>Live</span></div>
                  <div className="mt-7 grid grid-cols-4 gap-2 md:grid-cols-8">
                    {["PDF","EXTRACT","OCR","ANALYZE","TRANSLATE","CLEAN","TYPESET","QA"].map((x,i)=><div key={x} className="relative text-center"><div className={`mx-auto grid h-9 w-9 place-items-center rounded-xl border ${i<5?"border-violet-400/20 bg-violet-500/10 text-violet-300":"border-white/[.07] bg-white/[.02] text-zinc-600"}`}><span className="text-[9px] font-black">{i+1}</span></div><div className={`mt-2 text-[8px] font-bold tracking-wider ${i<5?"text-zinc-300":"text-zinc-600"}`}>{x}</div>{i<7&&<div className="absolute left-[calc(50%+22px)] top-[18px] hidden h-px w-[calc(100%-28px)] bg-white/[.07] md:block"/>}</div>)}
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-white/[.07] bg-[#0c0b12]">
                  <div className="flex items-center justify-between border-b border-white/[.06] p-5"><div><h2 className="text-sm font-bold">Recent Projects</h2><p className="mt-1 text-[11px] text-zinc-600">Latest manga localization activity</p></div><button className="flex items-center gap-1 text-[10px] text-zinc-500">View all <ChevronDown size={12}/></button></div>
                  <div className="divide-y divide-white/[.05]">
                    {(jobRows.length ? jobRows.map((j:any)=>({title:j.filename||"Untitled job",chapter:`Stage: ${j.stage}`,cover:(j.filename||"AI").slice(0,2).toUpperCase(),progress:j.progress??0,stage:j.stage,updated:new Date(j.updated_at||j.created_at).toLocaleString("uz-UZ"),tone:"violet"})) : projects).map(p=><div key={p.title} className="grid grid-cols-[minmax(180px,1.5fr)_90px_minmax(120px,1fr)_90px_70px] items-center gap-4 px-5 py-4">
                      <div className="flex items-center gap-3"><div className="grid h-11 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-700/60 to-fuchsia-900/60 text-[9px] font-black ring-1 ring-white/10">{p.cover}</div><div className="min-w-0"><div className="truncate text-xs font-semibold">{p.title}</div><div className="mt-1 text-[10px] text-zinc-600">{p.chapter} · JP → UZ</div></div></div>
                      <div className="text-[10px] text-zinc-500">{p.updated}</div>
                      <div><div className="mb-1.5 flex justify-between text-[9px]"><span className="text-zinc-600">Progress</span><span className="text-zinc-400">{p.progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" style={{width:p.progress+"%"}}/></div></div>
                      <Status>{p.stage}</Status><button className="justify-self-end text-zinc-600 hover:text-zinc-200"><MoreHorizontal size={17}/></button>
                    </div>)}
                  </div>
                </section>
              </div>

              <aside className="space-y-6">
                <section className="rounded-2xl border border-white/[.07] bg-[#0c0b12] p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-bold">Live Activity</h2><Activity size={15} className="text-zinc-600"/></div><div className="mt-5 space-y-4">{activity.map(([type,text,time])=><div key={text} className="flex gap-3"><div className="mt-0.5">{type==="warning"?<AlertTriangle size={14} className="text-amber-400"/>:type==="process"?<Cpu size={14} className="text-violet-400"/>:<CheckCircle2 size={14} className="text-emerald-400" />}</div><div className="min-w-0"><div className="text-[11px] leading-4 text-zinc-300">{text}</div><div className="mt-1 text-[9px] text-zinc-700">{time}</div></div></div>)}</div></section>
                <section className="rounded-2xl border border-white/[.07] bg-[#0c0b12] p-5"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold">AI System Health</h2><p className="mt-1 text-[10px] text-zinc-600">Provider status</p></div><ShieldCheck size={16} className="text-emerald-400"/></div><div className="mt-5 space-y-3">{[["Gemini","42ms"],["OpenAI","58ms"],["Local Processing","12ms"],["Storage","31ms"],["Database","18ms"]].map(([name,latency])=><div key={name} className="flex items-center justify-between rounded-xl border border-white/[.05] bg-white/[.02] px-3 py-2.5"><div className="flex items-center gap-2.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/><span className="text-[10px] text-zinc-400">{name}</span></div><span className="text-[9px] text-zinc-700">{latency}</span></div>)}</div></section>
              </aside>
            </div>

            <section className="rounded-2xl border border-white/[.07] bg-[#0c0b12] p-5 md:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold">AI Processing Usage</h2><p className="mt-1 text-[10px] text-zinc-600">Requests across the last 7 days</p></div><button className="flex items-center gap-2 rounded-lg border border-white/[.07] px-3 py-2 text-[10px] text-zinc-500">Last 7 days <ChevronDown size={12}/></button></div><div className="mt-6 h-36 w-full overflow-hidden rounded-xl bg-gradient-to-b from-violet-500/[.08] to-transparent p-4"><div className="flex h-full items-end gap-2">{[35,52,43,70,58,82,66,92,75,88,69,96,78,100,83,91,72,86,64,94,76,89,68,98].map((h,i)=><div key={i} className="flex-1 rounded-t bg-violet-500/60" style={{height:h+"%"}}/>)}</div></div></section>

            <footer className="flex flex-col gap-2 border-t border-white/[.05] pt-5 text-[9px] text-zinc-700 sm:flex-row sm:justify-between"><span>Akteynt Manga AI · Admin Console</span><span>AI pipeline v1.0 · Secure environment</span></footer>
          </div>
        </section>
      </div>
    </main>
  );
}
