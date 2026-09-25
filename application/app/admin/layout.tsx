import AdminGate from "@/components/AdminGate";

// Every page under /admin requires an admin account.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminGate label="Admin">{children}</AdminGate>;
}
