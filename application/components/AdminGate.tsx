import Link from "next/link";
import { requireUser } from "@/app/_auth/session";
import { logout } from "@/app/auth/actions";

// Shows `children` only to signed-in users with isAdmin = true. Signed-out
// visitors go to the login page; other users get a "no access" screen.
export default async function AdminGate({ label, children }: { label: string; children: React.ReactNode }) {
  const user = await requireUser("/admin");
  if (user.isAdmin) return <>{children}</>;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-6 text-zinc-100">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <span className="font-mono text-xs tracking-widest text-emerald-400">{`// ${label.toUpperCase()}`}</span>
        <h1 className="mt-2 text-4xl font-bold">No access</h1>
        <p className="mt-2 mb-8 text-sm text-zinc-400">
          You&apos;re signed in as <span className="text-zinc-100">{user.userName}</span>, which isn&apos;t an admin account.
        </p>
        <div className="flex gap-3">
          <Link href="/" className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300">
            Go home
          </Link>
          <form action={logout}>
            <button type="submit" className="rounded-full border border-zinc-700 px-6 py-3 font-semibold transition hover:border-zinc-500 cursor-pointer">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
