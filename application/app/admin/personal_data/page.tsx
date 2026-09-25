import type { Metadata } from "next";
import AdminGate from "@/components/AdminGate";
import { listPersonalData } from "@/database/lib/personal_data";
import PersonalDataManager from "./PersonalDataManager";

export const metadata: Metadata = { title: "Personal data", robots: { index: false } };

export default function PersonalDataPage() {
  return (
    <AdminGate label="Personal data">
      <Content />
    </AdminGate>
  );
}

async function Content() {
  let entries;
  try {
    entries = await listPersonalData();
  } catch (e) {
    console.error("Failed to load personal data", e);
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
        <p className="max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
          Couldn&apos;t load personal data. If you haven&apos;t yet, run the migration that creates the{" "}
          <code className="font-mono">personal_data</code> table.
        </p>
      </div>
    );
  }
  return <PersonalDataManager initial={entries} />;
}
