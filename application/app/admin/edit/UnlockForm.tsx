"use client";

import { useActionState } from "react";
import { unlock } from "./actions";

export default function UnlockForm() {
  const [error, action, pending] = useActionState(unlock, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input
        name="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        placeholder="Editor password"
        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-400/10"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-emerald-400 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-60 cursor-pointer"
      >
        {pending ? "Unlocking…" : "Unlock editor"}
      </button>
    </form>
  );
}
