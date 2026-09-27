export const MAX_PDF_SIZE = 100 * 1024 * 1024;

export function validatePdf(file: File) {
  if (!file || file.size === 0) return "PDF fayl bo'sh.";
  if (file.size > MAX_PDF_SIZE) return "PDF hajmi 100 MB dan oshdi.";
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "Faqat PDF fayl qabul qilinadi.";
  }
  return null;
}