"use client";

import dynamic from "next/dynamic";

// MDXEditor is client-only and drags in a sizable bundle. Dynamic import
// with ssr:false keeps the /contribute server render fast and avoids hydration
// mismatches from the editor's own portal-rendered UI.
const GuideEditor = dynamic(
  () => import("@/components/editor/GuideEditor").then((m) => m.GuideEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[600px] items-center justify-center text-sm text-muted-foreground">
        Loading editor…
      </div>
    ),
  },
);

export default function ContributeClient() {
  return <GuideEditor />;
}
