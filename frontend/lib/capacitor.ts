/**
 * Thin runtime helpers for detecting and using Capacitor native features.
 *
 * All Capacitor package imports are deferred to runtime via dynamic import so
 * the standard Next.js web build continues to work without Capacitor packages
 * installed. On native (Android), `window.Capacitor` is injected by the
 * WebView bridge, which also makes the plugin packages resolvable at runtime.
 *
 * Required: run `npm install` after adding this file to pull in the
 * Capacitor packages declared in package.json.
 */

/** Returns true when running inside a Capacitor native WebView. */
export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

// ─── Lazy loaders ─────────────────────────────────────────────────────────────
// Each function imports the Capacitor plugin at runtime only if on native.
// The module specifier is stored in a variable so webpack skips static bundling.

const _prefs  = "@capacitor/preferences";
const _net    = "@capacitor/network";
const _push   = "@capacitor/push-notifications";
const _camera = "@capacitor/camera";

export async function loadPreferences(): Promise<any | null> {
  if (!isNative()) return null;
  try { return (await import(_prefs as string)).Preferences; }
  catch { return null; }
}

export async function loadNetwork(): Promise<any | null> {
  if (!isNative()) return null;
  try { return (await import(_net as string)).Network; }
  catch { return null; }
}

export async function loadPushNotifications(): Promise<any | null> {
  if (!isNative()) return null;
  try { return (await import(_push as string)).PushNotifications; }
  catch { return null; }
}

export async function loadCamera(): Promise<any | null> {
  if (!isNative()) return null;
  try { return (await import(_camera as string)).Camera; }
  catch { return null; }
}
