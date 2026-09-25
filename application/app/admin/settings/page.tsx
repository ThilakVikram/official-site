import type { Metadata } from "next";
import { listGoogleApiKeys } from "@/database/lib/google_api_keys";
import ApiKeysManager from "./ApiKeysManager";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

// Admin-only: app/admin/layout.tsx gates every page under /admin.
export default async function SettingsPage() {
  let keys;
  try {
    keys = await listGoogleApiKeys();
  } catch (e) {
    console.error("Failed to load API keys", e);
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
        <p className="max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
          Couldn&apos;t load settings. If you haven&apos;t yet, run the migration that creates the{" "}
          <code className="font-mono">google_api_keys</code> table.
        </p>
      </div>
    );
  }
  return <ApiKeysManager initial={keys} hasEnvKey={!!process.env.GEMINI_API_KEY} />;
}
