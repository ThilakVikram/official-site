"use client";

import { useMemo, useState, useTransition } from "react";
import { Field, Icon, IconButton } from "../edit/fields";
import { createEntries, deleteEntry, updateEntry } from "./actions";
import { categories, LIMITS, type EntryInput, type PersonalDataEntry } from "./types";

const categoryColor: Record<string, string> = {
  about: "bg-sky-400/15 text-sky-300",
  skill: "bg-violet-400/15 text-violet-300",
  experience: "bg-amber-400/15 text-amber-300",
  project: "bg-emerald-400/15 text-emerald-300",
  education: "bg-indigo-400/15 text-indigo-300",
  email: "bg-pink-400/15 text-pink-300",
  contact: "bg-rose-400/15 text-rose-300",
};
const colorOf = (c: string) => categoryColor[c] ?? "bg-zinc-400/15 text-zinc-300";

const emptyDraft = (category = "about"): EntryInput => ({ category, title: "", content: "" });

function clean(e: EntryInput): EntryInput {
  return {
    category: e.category.trim().toLowerCase().slice(0, LIMITS.category),
    title: e.title.trim().slice(0, LIMITS.title),
    content: e.content.trim().slice(0, LIMITS.content),
  };
}

type Notice = { text: string; tone: "ok" | "error" };

export default function PersonalDataManager({ initial }: { initial: PersonalDataEntry[] }) {
  const [entries, setEntries] = useState(initial);
  const [drafts, setDrafts] = useState<EntryInput[]>([emptyDraft()]);
  const [editing, setEditing] = useState<{ id: string; value: EntryInput } | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, startTransition] = useTransition();

  const usedCategories = useMemo(() => [...new Set([...categories, ...entries.map((e) => e.category)])], [entries]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of entries) c[e.category] = (c[e.category] ?? 0) + 1;
    return c;
  }, [entries]);

  const visible = entries.filter((e) => {
    if (filter !== "all" && e.category !== filter) return false;
    const q = query.trim().toLowerCase();
    return !q || e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q);
  });

  const readyDrafts = drafts.map(clean).filter((d) => d.category && d.content);

  function saveDrafts() {
    if (!readyDrafts.length) return;
    startTransition(async () => {
      const res = await createEntries(readyDrafts);
      if (!res.ok) return setNotice({ text: res.error, tone: "error" });
      setEntries((es) => [...res.data, ...es]);
      setDrafts([emptyDraft(drafts[drafts.length - 1].category)]);
      setNotice({ text: `Added ${res.data.length} ${res.data.length === 1 ? "entry" : "entries"}`, tone: "ok" });
    });
  }

  function saveEdit() {
    if (!editing) return;
    const value = clean(editing.value);
    if (!value.category || !value.content) return setNotice({ text: "Category and content are required.", tone: "error" });
    startTransition(async () => {
      const res = await updateEntry(editing.id, value);
      if (!res.ok) return setNotice({ text: res.error, tone: "error" });
      setEntries((es) => es.map((e) => (e.id === res.data.id ? res.data : e)));
      setEditing(null);
      setNotice({ text: "Entry updated", tone: "ok" });
    });
  }

  function remove(entry: PersonalDataEntry) {
    if (!confirm(`Delete “${entry.title || entry.content.slice(0, 40)}”? This can't be undone.`)) return;
    startTransition(async () => {
      const res = await deleteEntry(entry.id);
      if (!res.ok) return setNotice({ text: res.error, tone: "error" });
      setEntries((es) => es.filter((e) => e.id !== entry.id));
      if (editing?.id === entry.id) setEditing(null);
      setNotice({ text: "Entry deleted", tone: "ok" });
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-lg sm:px-6">
        <span className="font-mono text-sm tracking-widest text-emerald-400">PERSONAL DATA</span>
        <span className="hidden sm:inline rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
        <div className="flex-1" />
        <a href="/admin/edit" className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100">
          Portfolio editor
        </a>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        {/* Composer */}
        <section className="lg:sticky lg:top-22 lg:self-start">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Add entries</h2>
            <p className="mt-0.5 text-sm text-zinc-500">Facts your AI assistant can use to answer questions about you. Keep each entry focused on one thing.</p>

            <div className="mt-5 flex flex-col gap-4">
              {drafts.map((d, i) => (
                <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-zinc-800 font-mono text-[11px] text-zinc-400">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium text-zinc-300">New entry</span>
                    {drafts.length > 1 && <IconButton icon="x" label="Remove draft" onClick={() => setDrafts((ds) => ds.filter((_, j) => j !== i))} />}
                  </div>
                  <EntryForm
                    value={d}
                    options={usedCategories}
                    onChange={(v) => setDrafts((ds) => ds.map((x, j) => (j === i ? v : x)))}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setDrafts((ds) => [...ds, emptyDraft(ds[ds.length - 1].category)])}
                className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 py-3 text-sm font-medium text-zinc-400 transition hover:border-emerald-400/60 hover:bg-emerald-400/5 hover:text-emerald-300 cursor-pointer"
              >
                <Icon name="plus" /> Add another entry
              </button>
              <button
                type="button"
                onClick={saveDrafts}
                disabled={pending || !readyDrafts.length}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:bg-zinc-800 disabled:text-zinc-500 cursor-pointer disabled:cursor-default"
              >
                {pending ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" /> : <Icon name="check" />}
                Save {readyDrafts.length > 1 ? `${readyDrafts.length} entries` : "entry"}
              </button>
            </div>
          </div>
        </section>

        {/* Entries */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search entries…"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition hover:border-zinc-700 focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-400/10 sm:max-w-xs"
            />
            <div className="flex flex-wrap gap-1.5">
              {["all", ...usedCategories.filter((c) => counts[c])].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilter(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition cursor-pointer ${
                    filter === c ? "bg-emerald-400 text-zinc-950" : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {c} <span className="opacity-60">{c === "all" ? entries.length : counts[c]}</span>
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 p-12 text-center text-sm text-zinc-500">
              {entries.length === 0 ? "No entries yet. Add your first one on the left." : "No entries match your search."}
            </div>
          ) : (
            <ul className="grid gap-3 xl:grid-cols-2">
              {visible.map((e) =>
                editing?.id === e.id ? (
                  <li key={e.id} className="rounded-2xl border border-emerald-400/40 bg-zinc-900/60 p-4 xl:col-span-2">
                    <EntryForm value={editing.value} options={usedCategories} onChange={(value) => setEditing({ id: e.id, value })} />
                    <div className="mt-4 flex justify-end gap-2">
                      <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer">
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={pending}
                        className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-60 cursor-pointer"
                      >
                        Save changes
                      </button>
                    </div>
                  </li>
                ) : (
                  <li key={e.id} className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-zinc-700">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${colorOf(e.category)}`}>{e.category}</span>
                      <span className="flex-1 truncate text-sm font-medium">{e.title}</span>
                      <SyncBadge entry={e} />
                    </div>
                    <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm leading-6 text-zinc-400">{e.content}</p>
                    <div className="mt-3 flex items-center gap-1 pt-1">
                      <span className="flex-1 text-[11px] text-zinc-600">Updated {new Date(e.updatedAt).toLocaleDateString()}</span>
                      <button
                        type="button"
                        onClick={() => setEditing({ id: e.id, value: { category: e.category, title: e.title, content: e.content } })}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
                      >
                        Edit
                      </button>
                      <IconButton icon="trash" label="Delete entry" danger onClick={() => remove(e)} disabled={pending} />
                    </div>
                  </li>
                ),
              )}
            </ul>
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

function EntryForm({ value, options, onChange }: { value: EntryInput; options: string[]; onChange: (v: EntryInput) => void }) {
  const custom = !options.includes(value.category);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-zinc-400">Category</span>
        <div className="flex flex-wrap gap-1.5">
          {options.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ ...value, category: c })}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition cursor-pointer ${
                value.category === c ? `${colorOf(c)} ring-1 ring-current` : "bg-zinc-900 text-zinc-500 ring-1 ring-zinc-800 hover:text-zinc-300"
              }`}
            >
              {c}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...value, category: custom ? value.category : "" })}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
              custom ? "bg-zinc-700 text-zinc-100 ring-1 ring-zinc-500" : "bg-zinc-900 text-zinc-500 ring-1 ring-zinc-800 hover:text-zinc-300"
            }`}
          >
            + Custom
          </button>
        </div>
        {custom && (
          <input
            autoFocus
            value={value.category}
            maxLength={LIMITS.category}
            onChange={(e) => onChange({ ...value, category: e.target.value })}
            placeholder="e.g. certification, hobby, language"
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-400/10"
          />
        )}
      </div>
      <Field label="Title (optional)" value={value.title} onChange={(title) => onChange({ ...value, title })} placeholder="e.g. Next.js, Acme Inc., B.E. Computer Science" />
      <Field
        label="Details"
        value={value.content}
        onChange={(content) => onChange({ ...value, content: content.slice(0, LIMITS.content) })}
        multiline
        rows={4}
        placeholder="Write it the way you'd want the assistant to explain it."
        hint={`${value.content.length} / ${LIMITS.content}`}
      />
    </div>
  );
}

function SyncBadge({ entry }: { entry: PersonalDataEntry }) {
  const synced = entry.syncedAt && entry.syncedAt >= entry.updatedAt;
  return (
    <span
      title={synced ? "Stored in the vector database" : "Not yet stored in the vector database"}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${synced ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${synced ? "bg-emerald-400" : "bg-amber-400"}`} />
      {synced ? "Synced" : "Not synced"}
    </span>
  );
}
