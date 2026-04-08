/** @type {import('next').NextConfig} */

// When building for Capacitor (CAPACITOR_BUILD=true), produce a fully static
// export so Capacitor can bundle the site as Android assets.
// The standard `npm run build` (for Vercel) uses the default server-side output.
const isCapacitor = process.env.CAPACITOR_BUILD === "true";

const nextConfig = {
  ...(isCapacitor && {
    output: "export",
    trailingSlash: true,
    // Required for static export — next/image optimisation must be disabled.
    images: { unoptimized: true },
  }),
};

export default nextConfig;
