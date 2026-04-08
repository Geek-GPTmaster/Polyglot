import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for Polyglot Android build.
 *
 * Build flow:
 *   npm run build:android   →  CAPACITOR_BUILD=true next build  (static export to /out)
 *                          →  npx cap sync android              (copy /out to Android assets)
 *   npx cap open android   →  open Android Studio, build APK
 *
 * Production server URL: set CAPACITOR_SERVER_URL env var before running build:android,
 * or hard-code your Vercel URL in the server.url field below.
 */
const config: CapacitorConfig = {
  appId: "com.polyglot.app",
  appName: "Polyglot",
  webDir: "out",
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Camera: {
      // Android camera permissions are declared in AndroidManifest.xml
    },
  },
  android: {
    backgroundColor: "#F7F3EC", // --color-paper
  },
};

export default config;
