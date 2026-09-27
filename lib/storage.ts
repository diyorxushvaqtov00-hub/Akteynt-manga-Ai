export interface FileStorage {
  put(path: string, data: Uint8Array, contentType: string): Promise<string>;
  get(path: string): Promise<Uint8Array>;
  remove(path: string): Promise<void>;
}

export function getStorage(): FileStorage {
  throw new Error(
    "Storage hali sozlanmagan. Supabase Storage yoki R2 adapterini ulang.",
  );
}