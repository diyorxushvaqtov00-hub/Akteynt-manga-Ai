export const MAX_ATTEMPTS = 3;

export function nextAttempt(attempt: number) {
  return attempt < MAX_ATTEMPTS ? attempt + 1 : null;
}

export function retryDelayMs(attempt: number) {
  return Math.min(30_000, 1_000 * 2 ** Math.max(0, attempt - 1));
}
