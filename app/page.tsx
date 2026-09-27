import { UploadPanel } from "@/components/upload/upload-panel";
import { Sparkles, FileText, Languages, WandSparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-600/20 ring-1 ring-purple-400/30">
              <Sparkles className="text-purple-300" />
            </div>
            <div>
              <div className="font-bold tracking-wide">AKTEYNT AI</div>
              <div className="text-xs text-zinc-500">MANGA TRANSLATOR</div>
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-400">
            MVP • 0.2
          </div>
        </header>

        <section className="py-20 text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-200">
            <WandSparkles size={15} /> AI-powered Uzbek translation
          </div>
          <h1 className="text-5xl font-black tracking-tight md:text-7xl">
            Manga & Manhwa<br />
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
              o‘zbek tilida.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-400 md:text-lg">
            PDF bobni yuklang. AI sahifalarni tahlil qiladi, matnni tarjima qiladi
            va original yozuvlarni o‘zbekcha matn bilan almashtiradi.
          </p>
        </section>

        <section className="mx-auto max-w-3xl">
          <UploadPanel />
        </section>

        <section className="mx-auto grid max-w-4xl gap-4 py-20 md:grid-cols-3">
          {[
            [FileText, "PDF", "Bobni yuklash"],
            [Languages, "AI", "OCR + o‘zbekcha tarjima"],
            [WandSparkles, "PDF", "Tayyor bobni olish"],
          ].map(([Icon, title, description]) => {
            const I = Icon as typeof FileText;
            return (
              <div key={title as string} className="rounded-2xl border border-white/8 bg-white/[.025] p-5">
                <I className="text-purple-300" size={20} />
                <div className="mt-3 font-bold">{title as string}</div>
                <div className="mt-1 text-sm text-zinc-500">{description as string}</div>
              </div>
            );
          })}
        </section>

        <footer className="border-t border-white/8 py-6 text-center text-xs text-zinc-600">
          Akteynt AI Manga Translator • Built for Uzbek manga readers
        </footer>
      </div>
    </main>
  );
}
