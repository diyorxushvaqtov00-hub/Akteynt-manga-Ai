export type PageStatus = "pending" | "processing" | "translated" | "failed";

export interface MangaPage {
  id: string;
  jobId: string;
  pageNumber: number;
  status: PageStatus;
  originalImagePath: string | null;
  translatedImagePath: string | null;
  error: string | null;
}

export function createPageRecords(jobId: string, totalPages: number): MangaPage[] {
  return Array.from({ length: totalPages }, (_, index) => ({
    id: crypto.randomUUID(),
    jobId,
    pageNumber: index + 1,
    status: "pending",
    originalImagePath: null,
    translatedImagePath: null,
    error: null,
  }));
}

export function calculateProgress(pages: MangaPage[]) {
  if (!pages.length) return 0;
  const completed = pages.filter((page) => page.status === "translated").length;
  return Math.round((completed / pages.length) * 100);
}