export type JobStep =
  | "upload"
  | "extract"
  | "vision"
  | "translate"
  | "render"
  | "assemble";

export interface QueueTask {
  jobId: string;
  pageNumber: number;
  step: JobStep;
  attempt: number;
}

export const MAX_PAGE_ATTEMPTS = 3;

export function nextAttempt(task: QueueTask): QueueTask | null {
  if (task.attempt >= MAX_PAGE_ATTEMPTS) return null;
  return { ...task, attempt: task.attempt + 1 };
}