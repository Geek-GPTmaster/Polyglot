/**
 * OCR camera import — Capacitor Camera + Tesseract.js
 *
 * Flow:
 *   1. `capturePhoto()` opens the device camera and returns a base64 data URL.
 *   2. `ocrImage(dataUrl)` runs Tesseract.js in a worker and returns extracted text.
 *   3. `captureAndOCR(onProgress?)` is the convenience wrapper used by the UI.
 *
 * Both functions degrade gracefully when Capacitor is unavailable:
 *   - `capturePhoto()` returns null in the browser (camera unavailable).
 *   - `ocrImage()` still works in the browser for testing with file uploads.
 */

import { loadCamera } from "./capacitor";

// ─── Camera capture ───────────────────────────────────────────────────────────

/** Opens the device camera and returns the captured image as a data URL. */
export async function capturePhoto(): Promise<string | null> {
  const Camera = await loadCamera();
  if (!Camera) return null;

  try {
    const photo = await Camera.getPhoto({
      resultType: "dataUrl",   // CameraResultType.DataUrl
      source:     "camera",    // CameraSource.Camera
      quality:    90,
    });
    return photo.dataUrl ?? null;
  } catch (err: any) {
    // User cancelled the camera UI
    if (err?.message?.includes("cancel") || err?.message?.includes("User cancelled")) {
      return null;
    }
    throw err;
  }
}

// ─── OCR ──────────────────────────────────────────────────────────────────────

export type OcrProgress = {
  status: string;  // e.g. "recognizing text"
  progress: number; // 0–1
};

/**
 * Runs Tesseract.js OCR on the given image URL.
 * Language defaults to English; pass an ISO-639-1 code that Tesseract supports.
 * @param imageUrl  A data URL, object URL, or any URL Tesseract can fetch.
 * @param lang      Tesseract language code (e.g. "eng", "spa", "fra").
 * @param onProgress  Optional progress callback.
 */
export async function ocrImage(
  imageUrl: string,
  lang = "eng",
  onProgress?: (p: OcrProgress) => void
): Promise<string> {
  // Dynamic import so Tesseract.js is only bundled in the Capacitor build.
  const tesseractPkg = "tesseract.js";
  const { createWorker } = await import(tesseractPkg as string) as any;

  const worker = await createWorker(lang, 1, {
    logger: (m: any) => {
      if (onProgress && m.status === "recognizing text") {
        onProgress({ status: m.status, progress: m.progress ?? 0 });
      }
    },
  });

  try {
    const { data } = await worker.recognize(imageUrl);
    return (data.text as string).trim();
  } finally {
    await worker.terminate();
  }
}

// ─── Convenience wrapper ──────────────────────────────────────────────────────

/** Language code mapping from app lang codes to Tesseract codes. */
const TESSERACT_LANG: Record<string, string> = {
  en: "eng",
  es: "spa",
  fr: "fra",
  de: "deu",
  pt: "por",
  zh: "chi_sim",
  ja: "jpn",
};

/**
 * Captures a photo and extracts text via OCR.
 * Returns `null` if the user cancelled the camera.
 */
export async function captureAndOCR(
  languageCode = "en",
  onProgress?: (p: OcrProgress) => void
): Promise<string | null> {
  const dataUrl = await capturePhoto();
  if (!dataUrl) return null;
  const tessLang = TESSERACT_LANG[languageCode] ?? "eng";
  return ocrImage(dataUrl, tessLang, onProgress);
}
