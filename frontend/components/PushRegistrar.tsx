"use client";

import { useEffect } from "react";
import { registerPushNotifications } from "@/lib/notifications";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Registers for FCM push notifications on native (Capacitor) platforms.
 * On web this is a no-op — safe to mount unconditionally.
 */
export default function PushRegistrar() {
  useEffect(() => {
    registerPushNotifications(API_BASE).catch(() => {});
  }, []);
  return null;
}
