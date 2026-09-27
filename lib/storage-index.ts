import { SupabaseStorage } from "./storage-supabase";
import type { FileStorage } from "./storage";

export function getRealStorage(): FileStorage {
  return new SupabaseStorage();
}