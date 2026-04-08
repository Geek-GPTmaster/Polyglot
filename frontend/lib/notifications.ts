/**
 * Push-notification registration for Capacitor Android.
 *
 * Call `registerPushNotifications(apiBase)` once on app startup (e.g. in
 * layout.tsx useEffect) when running on a native platform.  It will:
 *   1. Request permission via Capacitor PushNotifications.
 *   2. Listen for the FCM registration token.
 *   3. POST the token to the backend (/api/notifications/subscribe).
 *   4. Trigger a daily-reminder check (/api/notifications/send-daily).
 *
 * On web (non-native), this function is a no-op.
 */

import { loadPushNotifications, isNative } from "./capacitor";

export async function registerPushNotifications(apiBase: string): Promise<void> {
  if (!isNative()) return;

  const PushNotifications = await loadPushNotifications();
  if (!PushNotifications) return;

  // Request permission
  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== "granted") return;

  await PushNotifications.register();

  // Listen for the registration token (called once after register())
  await PushNotifications.addListener("registration", async (token: { value: string }) => {
    try {
      await fetch(`${apiBase}/api/notifications/subscribe`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token: token.value }),
      });
      // Ask the backend to send a daily reminder if words are due
      await fetch(`${apiBase}/api/notifications/send-daily`, { method: "POST" });
    } catch {
      // Non-critical — app works fine without push
    }
  });

  // Handle a notification tap while the app is in the foreground
  await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action: { notification: { data?: { route?: string } } }) => {
      const route = action.notification?.data?.route;
      if (route && typeof window !== "undefined") {
        window.location.href = route;
      }
    }
  );
}
