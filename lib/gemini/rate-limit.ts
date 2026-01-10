/**
 * Minimal Gemini request limiter with retry/backoff for rate-limit errors.
 * Concurrency is kept low (default 2) with light spacing + jitter to smooth bursts.
 */

type Task<T> = () => Promise<T>;

const CONCURRENCY = 2;
const MIN_SPACING_MS = 150;
const JITTER_MS = 150;
const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000]; // capped backoff

let active = 0;
const queue: Array<() => void> = [];
let lastStart = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function next() {
  if (active >= CONCURRENCY) return;
  const job = queue.shift();
  if (!job) return;
  job();
}

async function runQueued<T>(task: Task<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = async () => {
      active += 1;
      const sinceLast = Date.now() - lastStart;
      const delay = Math.max(0, MIN_SPACING_MS - sinceLast) + Math.random() * JITTER_MS;
      await sleep(delay);
      lastStart = Date.now();
      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        active -= 1;
        next();
      }
    };
    queue.push(run);
    next();
  });
}

function isRateLimitError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  const errObj = error as any;
  const code = errObj?.error?.code || errObj?.status || errObj?.code;

  return (
    /429/i.test(message) ||
    /RESOURCE_EXHAUSTED/i.test(message) ||
    /quota/i.test(message) ||
    /rate limit/i.test(message) ||
    code === 429 ||
    code === "RESOURCE_EXHAUSTED"
  );
}

export async function runWithGeminiLimiter<T>(task: Task<T>): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await runQueued(task);
    } catch (error) {
      lastError = error;
      const shouldRetry =
        attempt < RETRY_DELAYS_MS.length && isRateLimitError(error);

      if (!shouldRetry) {
        throw error;
      }

      const backoff = RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
      const jitter = Math.random() * 250;
      await sleep(backoff + jitter);
    }
  }

  // If we somehow exit the loop without returning, throw the last known error
  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Failed after retries due to rate limits");
}
