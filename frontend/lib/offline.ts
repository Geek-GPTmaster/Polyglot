/**
 * Offline article cache.
 *
 * On native (Capacitor): uses @capacitor/preferences — survives app restarts.
 * In browser: falls back to localStorage (for dev/testing).
 *
 * Cache key per article: `polyglot_article_<id>`
 */

import type { Article } from "./types";
import { loadPreferences, loadNetwork, isNative } from "./capacitor";

const PREFIX = "polyglot_article_";

// ─── Persist ──────────────────────────────────────────────────────────────────

export async function cacheArticle(article: Article): Promise<void> {
  const value = JSON.stringify(article);
  const Preferences = await loadPreferences();
  if (Preferences) {
    await Preferences.set({ key: PREFIX + article.id, value });
  } else {
    try { localStorage.setItem(PREFIX + article.id, value); } catch {}
  }
}

// ─── Retrieve ─────────────────────────────────────────────────────────────────

export async function getCachedArticle(id: number): Promise<Article | null> {
  const Preferences = await loadPreferences();
  let raw: string | null = null;
  if (Preferences) {
    const result = await Preferences.get({ key: PREFIX + id });
    raw = result.value ?? null;
  } else {
    try { raw = localStorage.getItem(PREFIX + id); } catch {}
  }
  if (!raw) return null;
  try { return JSON.parse(raw) as Article; } catch { return null; }
}

// ─── Network status ───────────────────────────────────────────────────────────

/** Returns true when the device has an active network connection. */
export async function isOnline(): Promise<boolean> {
  if (!isNative()) return navigator.onLine;
  const Network = await loadNetwork();
  if (!Network) return navigator.onLine;
  const status = await Network.getStatus();
  return status.connected as boolean;
}

/**
 * Listen for network changes. Returns an unsubscribe function.
 * Only fires on native; browser uses the standard `online`/`offline` events.
 */
export function onNetworkChange(
  callback: (connected: boolean) => void
): () => void {
  if (!isNative()) {
    const handler = () => callback(navigator.onLine);
    window.addEventListener("online",  handler);
    window.addEventListener("offline", handler);
    return () => {
      window.removeEventListener("online",  handler);
      window.removeEventListener("offline", handler);
    };
  }

  let handle: any = null;
  loadNetwork().then((Network) => {
    if (!Network) return;
    Network.addListener("networkStatusChange", (status: any) => {
      callback(status.connected);
    }).then((h: any) => { handle = h; });
  });

  return () => { handle?.remove?.(); };
}
