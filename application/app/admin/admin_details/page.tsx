import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin details", robots: { index: false } };

// Placeholder until the real page is written; an empty page.tsx fails `next build`.
export default function AdminDetailsPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
      <h1 className="text-lg font-medium">Admin details — coming soon</h1>
    </div>
  );
}
