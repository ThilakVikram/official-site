import { isEditor } from "@/app/admin/edit/actions";
import UnlockForm from "@/app/admin/edit/UnlockForm";

// Shows `children` only to someone who has unlocked with EDIT_PASSWORD;
// everyone else gets the unlock screen.
export default async function AdminGate({ label, children }: { label: string; children: React.ReactNode }) {
  if (await isEditor()) return <>{children}</>;

  const enabled = !!process.env.EDIT_PASSWORD;
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-6 text-zinc-100">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <span className="font-mono text-xs tracking-widest text-emerald-400">{`// ${label.toUpperCase()}`}</span>
        <h1 className="mt-2 text-4xl font-bold">Unlock</h1>
        {enabled ? (
          <>
            <p className="mt-2 mb-8 text-sm text-zinc-400">Enter the editor password to continue.</p>
            <UnlockForm />
          </>
        ) : (
          <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-200">
            Editing is disabled. Add <code className="font-mono text-amber-100">EDIT_PASSWORD=…</code> to your <code className="font-mono text-amber-100">.env</code> file and restart the server.
          </p>
        )}
      </div>
    </div>
  );
}
