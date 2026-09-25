"use client";

import { useState, useTransition } from "react";
import { Field, IconButton } from "../edit/fields";
import { activateKey, addKey, editKey, removeKey, testKey } from "./actions";
import type { ActionResult, ApiKeyEntry, ApiKeyInput } from "./types";

type Notice = { text: string; tone: "ok" | "error" };

const mask = (key: string) => (key.length <= 10 ? "•".repeat(key.length) : `${key.slice(0, 6)}${"•".repeat(12)}${key.slice(-4)}`);

const buttonClass =
  "rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer";

export default function ApiKeysManager({ initial, hasEnvKey }: { initial: ApiKeyEntry[]; hasEnvKey: boolean }) {
  const [keys, setKeys] = useState(initial);
  const [draft, setDraft] = useState<ApiKeyInput>({ label: "", key: "" });
  const [editing, setEditing] = useState<{ id: number; value: ApiKeyInput } | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, startTransition] = useTransition();

  const active = keys.find((k) => k.isActive);

  // Runs an action that returns the updated list.
  function mutate(action: () => Promise<ActionResult<ApiKeyEntry[]>>, success: string, after?: () => void) {
    startTransition(async () => {
      const res = await action();
      if (!res.ok) return setNotice({ text: res.error, tone: "error" });
      setKeys(res.data);
      after?.();
      setNotice({ text: success, tone: "ok" });
    });
  }

  function test(key: string) {
    startTransition(async () => {
      const res = await testKey(key);
      setNotice(res.ok ? { text: res.data, tone: "ok" } : { text: res.error, tone: "error" });
    });
  }

  function toggleReveal(id: number) {
    setRevealed((r) => {
      const next = new Set(r);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  async function copy(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      setNotice({ text: "Key copied", tone: "ok" });
    } catch {
      setNotice({ text: "Couldn't copy. Reveal the key and copy it by hand.", tone: "error" });
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-lg sm:px-6">
        <span className="font-mono text-sm tracking-widest text-emerald-400">SETTINGS</span>
        <div className="flex-1" />
        <a href="/admin/edit" className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100">
          Portfolio editor
        </a>
        <a href="/admin/personal_data" className="hidden sm:block rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100">
          Personal data
        </a>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold">Google API keys</h1>
          <p className="mt-1 text-sm text-zinc-500">
            The AI assistant uses the active key. Switching takes effect on the next question visitors ask.
          </p>
        </div>

        {/* What the assistant is using right now */}
        <div
          className={`rounded-2xl border p-4 text-sm ${
            active || hasEnvKey ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-200" : "border-amber-400/30 bg-amber-400/10 text-amber-200"
          }`}
        >
          {active ? (
            <>
              Using <span className="font-semibold text-zinc-100">{active.label}</span>{" "}
              <span className="font-mono text-xs text-zinc-400">{mask(active.key)}</span>
            </>
          ) : hasEnvKey ? (
            <>
              No key is active here, so the assistant is using <code className="font-mono">GEMINI_API_KEY</code> from <code className="font-mono">.env</code>.
            </>
          ) : (
            <>No API key is set, so the assistant can&apos;t answer. Add a key below.</>
          )}
        </div>

        {/* Add a key */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Add a key</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Create one in{" "}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
              Google AI Studio
            </a>
            . The first key you add becomes active.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
            <Field label="Label" value={draft.label} onChange={(label) => setDraft((d) => ({ ...d, label }))} placeholder="e.g. Personal, Work" />
            <Field label="API key" type="password" value={draft.key} onChange={(key) => setDraft((d) => ({ ...d, key }))} placeholder="AIza…" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => test(draft.key)}
              disabled={pending || !draft.key.trim()}
              className={`${buttonClass} border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100`}
            >
              Test
            </button>
            <button
              type="button"
              onClick={() => mutate(() => addKey(draft), "Key added", () => setDraft({ label: "", key: "" }))}
              disabled={pending || !draft.key.trim()}
              className={`${buttonClass} bg-emerald-400 text-zinc-950 hover:bg-emerald-300`}
            >
              Add key
            </button>
          </div>
        </section>

        {/* Saved keys */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-zinc-400">
            Saved keys <span className="text-zinc-600">({keys.length})</span>
          </h2>
          {!keys.length && <p className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">No keys saved yet.</p>}

          {keys.map((k) =>
            editing?.id === k.id ? (
              <div key={k.id} className="rounded-2xl border border-emerald-400/40 bg-zinc-900/60 p-4">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
                  <Field label="Label" value={editing.value.label} onChange={(label) => setEditing({ ...editing, value: { ...editing.value, label } })} />
                  <Field label="API key" value={editing.value.key} onChange={(key) => setEditing({ ...editing, value: { ...editing.value, key } })} />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setEditing(null)} className={`${buttonClass} text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100`}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => mutate(() => editKey(k.id, editing.value), "Key updated", () => setEditing(null))}
                    disabled={pending || !editing.value.key.trim()}
                    className={`${buttonClass} bg-emerald-400 text-zinc-950 hover:bg-emerald-300`}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={k.id}
                className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${
                  k.isActive ? "border-emerald-400/40 bg-emerald-400/5" : "border-zinc-800 bg-zinc-900/40"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{k.label}</span>
                    {k.isActive && (
                      <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-mono text-[10px] tracking-wider text-emerald-400">ACTIVE</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <code className="min-w-0 truncate font-mono text-xs text-zinc-400">{revealed.has(k.id) ? k.key : mask(k.key)}</code>
                    <IconButton icon={revealed.has(k.id) ? "eyeOff" : "eye"} label={revealed.has(k.id) ? "Hide key" : "Show key"} onClick={() => toggleReveal(k.id)} />
                    <IconButton icon="copy" label="Copy key" onClick={() => copy(k.key)} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!k.isActive && (
                    <button
                      type="button"
                      onClick={() => mutate(() => activateKey(k.id), `Now using “${k.label}”`)}
                      disabled={pending}
                      className={`${buttonClass} bg-emerald-400 text-zinc-950 hover:bg-emerald-300`}
                    >
                      Use this key
                    </button>
                  )}
                  <button type="button" onClick={() => test(k.key)} disabled={pending} className={`${buttonClass} text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100`}>
                    Test
                  </button>
                  <IconButton icon="pencil" label="Edit key" onClick={() => setEditing({ id: k.id, value: { label: k.label, key: k.key } })} disabled={pending} />
                  <IconButton
                    icon="trash"
                    label="Delete key"
                    danger
                    disabled={pending}
                    onClick={() =>
                      confirm(`Delete “${k.label}”?${k.isActive ? " It's the active key, so the assistant will stop using it." : ""}`) &&
                      mutate(() => removeKey(k.id), "Key deleted")
                    }
                  />
                </div>
              </div>
            ),
          )}
        </section>
      </div>

      {notice && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${
            notice.tone === "error" ? "border-red-500/30 bg-red-950/90 text-red-200" : "border-zinc-700 bg-zinc-900/95 text-zinc-100"
          }`}
        >
          {notice.text}
          <IconButton icon="x" label="Dismiss" onClick={() => setNotice(null)} />
        </div>
      )}
    </div>
  );
}
