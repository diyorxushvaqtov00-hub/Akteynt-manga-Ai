export type TranslationJobStatus =
  | "uploaded"
  | "extracting"
  | "processing"
  | "analyzing"
  | "translating"
  | "rendering"
  | "assembling"
  | "completed"
  | "failed";

export interface TranslationJob {
  id: string;
  filename: string;
  sourceLanguage: string;
  targetLanguage: "uz";
  status: TranslationJobStatus;
  progress: number;
  currentPage: number;
  totalPages: number | null;
}