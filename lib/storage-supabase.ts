import { getSupabaseAdmin } from "./supabase";
import type { FileStorage } from "./storage";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "manga-files";

export class SupabaseStorage implements FileStorage {
  async put(path: string, data: Uint8Array, contentType: string) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, data, { contentType, upsert: true });

    if (error) throw error;
    return path;
  }

  async get(path: string) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage.from(BUCKET).download(path);

    if (error || !data) throw error ?? new Error("Fayl topilmadi.");
    return new Uint8Array(await data.arrayBuffer());
  }

  async remove(path: string) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw error;
  }
}