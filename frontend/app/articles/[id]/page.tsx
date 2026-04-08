// Server component — exports generateStaticParams for Capacitor static export.
// All interactive logic lives in ArticleReader (client component).
//
// With `output: 'export'` (CAPACITOR_BUILD=true), generateStaticParams returning []
// means no pages are pre-built. The Next.js client-side router handles navigation
// to /articles/[id] after the app is loaded from the root — which is the only way
// users navigate inside Capacitor (no browser address bar / refresh).

import ArticleReader from "./ArticleReader";

export function generateStaticParams() { return []; }

export default function ArticleReaderPage({ params }: { params: { id: string } }) {
  return <ArticleReader id={parseInt(params.id, 10)} />;
}
