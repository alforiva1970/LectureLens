import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
  onWait?: (msg: string) => void
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;
    
    let waitTime = delay;
    const errorMessage = error?.message || String(error);
    let isQuotaError = false;
    
    // Check for 429 Quota error and extract the required wait time
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('Quota exceeded')) {
      isQuotaError = true;
      const match = errorMessage.match(/retry in ([\d.]+)s/);
      if (match && match[1]) {
        waitTime = Math.ceil(parseFloat(match[1])) * 1000 + 2000; // Add 2 seconds buffer
      } else {
        waitTime = 60000; // Default 1 minute wait for quota errors if not specified
      }
      if (onWait) {
        onWait(`Quota Google superata. In attesa di ${Math.round(waitTime/1000)} secondi per riprovare in automatico...`);
      }
      console.warn(`[Retry] Quota exceeded. Waiting ${waitTime}ms before retrying...`);
    } else {
      console.warn(`[Retry] Error occurred: ${errorMessage}. Retrying in ${waitTime}ms...`);
    }
    
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    // If it was a quota error, don't exponentially backoff the base delay, just use the required wait time
    return retry(fn, retries - 1, isQuotaError ? delay : delay * 2, onWait);
  }
}
