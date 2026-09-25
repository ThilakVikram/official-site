"use client";

import { useId, useState } from "react";

const paths = {
  plus: "M12 4.5v15m7.5-7.5h-15",
  x: "M6 18 18 6M6 6l12 12",
  up: "m4.5 15.75 7.5-7.5 7.5 7.5",
  down: "m19.5 8.25-7.5 7.5-7.5-7.5",
  check: "m4.5 12.75 6 6 9-13.5",
  grip: "M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01",
  user: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z",
  lock: "M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z",
  external: "M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25",
  copy: "M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75",
  trash: "m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0",
  eye: "M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  eyeOff: "M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88",
};

export type IconName = keyof typeof paths;

export function Icon({ name, className = "w-4 h-4" }: { name: IconName; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={name === "grip" ? 3 : 1.5} stroke="currentColor" className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[name]} />
    </svg>
  );
}

export function IconButton({ icon, label, onClick, disabled, danger }: { icon: IconName; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${
        danger ? "hover:bg-red-500/10 hover:text-red-400" : "hover:bg-zinc-800 hover:text-zinc-100"
      }`}
    >
      <Icon name={icon} />
    </button>
  );
}

const inputClass =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition hover:border-zinc-700 focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-400/10";

export function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  rows = 4,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  type?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-zinc-400">{label}</label>
      {multiline ? (
        <textarea id={id} value={value} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`${inputClass} resize-y leading-6`} />
      ) : (
        <input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
      {hint && <span className="text-[11px] text-zinc-600">{hint}</span>}
    </div>
  );
}

// Chips input: Enter or comma adds, Backspace on an empty input removes the last chip.
export function TagInput({ label, value, onChange, placeholder = "Type and press Enter" }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const id = useId();
  const [draft, setDraft] = useState("");

  function add(text: string) {
    const next = text.split(",").map((t) => t.trim()).filter((t) => t && !value.includes(t));
    if (next.length) onChange([...value, ...next]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-zinc-400">{label}</label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 transition hover:border-zinc-700 focus-within:border-emerald-400/70 focus-within:ring-4 focus-within:ring-emerald-400/10">
        {value.map((t, i) => (
          <span key={t + i} className="group flex items-center gap-1 rounded-lg bg-emerald-400/10 py-1 pl-2.5 pr-1 text-xs font-medium text-emerald-300">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded p-0.5 text-emerald-300/60 hover:bg-emerald-400/20 hover:text-emerald-200 cursor-pointer">
              <Icon name="x" className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          placeholder={value.length ? "" : placeholder}
          onChange={(e) => (e.target.value.includes(",") ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft && add(draft)}
          className="min-w-24 flex-1 bg-transparent px-1.5 py-1 text-sm text-zinc-100 placeholder-zinc-600 outline-none"
        />
      </div>
    </div>
  );
}

export function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length || from === to) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// A list of cards the user can add to, remove from and reorder.
export function ItemList<T>({
  items,
  onChange,
  newItem,
  addLabel,
  itemLabel,
  render,
  grid,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  addLabel: string;
  itemLabel: (item: T, index: number) => string;
  render: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode;
  grid?: boolean;
}) {
  const update = (i: number) => (patch: Partial<T>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  return (
    <div className="flex flex-col gap-3">
      <div className={grid ? "grid gap-3 sm:grid-cols-2" : "flex flex-col gap-3"}>
        {items.map((item, i) => (
          <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-zinc-800 font-mono text-[11px] text-zinc-400">{i + 1}</span>
              <span className="flex-1 truncate text-sm font-medium text-zinc-300">{itemLabel(item, i) || <span className="text-zinc-600">Untitled</span>}</span>
              <IconButton icon="up" label="Move up" onClick={() => onChange(move(items, i, i - 1))} disabled={i === 0} />
              <IconButton icon="down" label="Move down" onClick={() => onChange(move(items, i, i + 1))} disabled={i === items.length - 1} />
              <IconButton icon="copy" label="Duplicate" onClick={() => onChange([...items.slice(0, i + 1), structuredClone(item), ...items.slice(i + 1)])} />
              <IconButton icon="trash" label="Remove" danger onClick={() => onChange(items.filter((_, j) => j !== i))} />
            </div>
            <div className="flex flex-col gap-3">{render(item, update(i))}</div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, newItem()])}
        className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 py-3 text-sm font-medium text-zinc-400 transition hover:border-emerald-400/60 hover:bg-emerald-400/5 hover:text-emerald-300 cursor-pointer"
      >
        <Icon name="plus" /> {addLabel}
      </button>
    </div>
  );
}
