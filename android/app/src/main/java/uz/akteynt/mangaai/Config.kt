package uz.akteynt.mangaai
object Config {
    const val API_BASE_URL="https://akteynt-manga-ai.vercel.app"
    const val SUPABASE_URL="https://mnbyaetebzfjtpyekcpg.supabase.co"
    val SUPABASE_PUBLISHABLE_KEY: String get() = BuildConfig.SUPABASE_PUBLISHABLE_KEY
}
