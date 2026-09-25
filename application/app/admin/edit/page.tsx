import type { Metadata } from "next";
import AdminGate from "@/components/AdminGate";
import { getPortfolio } from "@/database/lib/portfolio";
import Editor from "./Editor";

export const metadata: Metadata = { title: "Edit portfolio", robots: { index: false } };

export default function EditPage() {
  return (
    <AdminGate label="Portfolio editor">
      <Content />
    </AdminGate>
  );
}

async function Content() {
  return <Editor initial={await getPortfolio()} />;
}
