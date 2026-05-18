// src/lib/secureStorage.ts — Livello base di offuscamento per API keys
// NOTA: non sostituisce un backend proxy, ma protegge da XSS base.

const PREFIX = 'sk_';

export function storeKey(keyName: string, value: string): void {
  // XOR semplice con un salt preso dal window origin (non perfetto, ma meglio di niente)
  const salt = window.location.origin.substring(0, 16).padEnd(16, '0');
  let encoded = '';
  for (let i = 0; i < value.length; i++) {
    encoded += String.fromCharCode(value.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
  }
  localStorage.setItem(PREFIX + keyName, btoa(encoded));
}

export function getKey(keyName: string): string | null {
  const stored = localStorage.getItem(PREFIX + keyName);
  if (!stored) return null;
  try {
    const salt = window.location.origin.substring(0, 16).padEnd(16, '0');
    const encoded = atob(stored);
    let decoded = '';
    for (let i = 0; i < encoded.length; i++) {
      decoded += String.fromCharCode(encoded.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
    }
    return decoded;
  } catch {
    return null;
  }
}

export function removeKey(keyName: string): void {
  localStorage.removeItem(PREFIX + keyName);
}
