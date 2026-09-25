"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import PortfolioView from "../../_portfolio/PortfolioView";
import {
  newId,
  newJob,
  newProject,
  newService,
  newSection,
  normalizePortfolio,
  sectionTypes,
  type Portfolio,
  type Profile,
  type Section,
  type SectionType,
} from "../../_portfolio/content";
import { save } from "./actions";
import { logout } from "@/app/auth/actions";
import { Field, Icon, IconButton, ItemList, TagInput, move } from "./fields";

type View = "edit" | "split" | "preview";
type Toast = { text: string; tone: "ok" | "error"; action?: { label: string; run: () => void } };

const typeColor: Record<SectionType, string> = {
  about: "bg-sky-400/15 text-sky-300",
  skills: "bg-violet-400/15 text-violet-300",
  projects: "bg-emerald-400/15 text-emerald-300",
  services: "bg-teal-400/15 text-teal-300",
  experience: "bg-amber-400/15 text-amber-300",
  text: "bg-zinc-400/15 text-zinc-300",
  contact: "bg-pink-400/15 text-pink-300",
};

export default function Editor({ initial }: { initial: Portfolio }) {
  const [data, setData] = useState(initial);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial));
  const [selected, setSelected] = useState<string>("profile");
  const [view, setView] = useState<View>("split");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [saving, startSaving] = useTransition();
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const dirty = JSON.stringify(data) !== savedJson;
  const section = data.sections.find((s) => s.id === selected);

  function notify(t: Toast) {
    setToast(t);
  }
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.action ? 6000 : 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const setSections = (fn: (s: Section[]) => Section[]) => setData((d) => ({ ...d, sections: fn(d.sections) }));
  const updateSection = (id: string, patch: Partial<Section>) =>
    setSections((ss) => ss.map((s) => (s.id === id ? ({ ...s, ...patch } as Section) : s)));
  const updateProfile = (patch: Partial<Profile>) => setData((d) => ({ ...d, profile: { ...d.profile, ...patch } }));

  function addSection(type: SectionType) {
    const s = newSection(type);
    setSections((ss) => {
      // Services go right below Projects; otherwise keep a contact section at the bottom.
      const projectsAt = ss.findLastIndex((x) => x.type === "projects");
      if (type === "services" && projectsAt >= 0) return [...ss.slice(0, projectsAt + 1), s, ...ss.slice(projectsAt + 1)];
      const contactAt = ss.findIndex((x) => x.type === "contact");
      return type !== "contact" && contactAt === ss.length - 1 ? [...ss.slice(0, -1), s, ss[ss.length - 1]] : [...ss, s];
    });
    setSelected(s.id);
    setAdding(false);
  }

  function duplicateSection(id: string) {
    const i = data.sections.findIndex((s) => s.id === id);
    const copy = { ...structuredClone(data.sections[i]), id: newId(), title: `${data.sections[i].title} (copy)` };
    setSections((ss) => [...ss.slice(0, i + 1), copy, ...ss.slice(i + 1)]);
    setSelected(copy.id);
  }

  function deleteSection(id: string) {
    const i = data.sections.findIndex((s) => s.id === id);
    const removed = data.sections[i];
    setSections((ss) => ss.filter((s) => s.id !== id));
    setSelected(data.sections[i + 1]?.id ?? data.sections[i - 1]?.id ?? "profile");
    notify({
      text: `Deleted “${removed.title || removed.type}”`,
      tone: "ok",
      action: {
        label: "Undo",
        run: () => {
          setSections((ss) => [...ss.slice(0, i), removed, ...ss.slice(i)]);
          setSelected(removed.id);
        },
      },
    });
  }

  function doSave() {
    if (saving) return;
    const clean = normalizePortfolio(data);
    startSaving(async () => {
      const res = await save(clean);
      if (res.ok) {
        setData(clean);
        setSavedJson(JSON.stringify(clean));
        notify({ text: "Saved — your site is updated", tone: "ok" });
      } else {
        notify({ text: res.error, tone: "error" });
      }
    });
  }

  function discard() {
    if (!confirm("Discard all unsaved changes?")) return;
    const saved = JSON.parse(savedJson) as Portfolio;
    setData(saved);
    if (selected !== "profile" && !saved.sections.some((s) => s.id === selected)) setSelected("profile");
  }

  // Ctrl/Cmd+S saves.
  const saveRef = useRef(doSave);
  useLayoutEffect(() => {
    saveRef.current = doSave;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);

  function onDrop(to: number) {
    if (dragFrom !== null) setSections((ss) => move(ss, dragFrom, to));
    setDragFrom(null);
    setDragOver(null);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-3 border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-lg">
        <span className="font-mono text-sm tracking-widest text-emerald-400">EDITOR</span>
        <span
          className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            dirty ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dirty ? "bg-amber-400" : "bg-emerald-400"}`} />
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>

        <div className="mx-auto flex rounded-xl border border-zinc-800 bg-zinc-900 p-1 text-xs font-medium">
          {(["edit", "split", "preview"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-lg px-3 py-1.5 capitalize transition cursor-pointer ${v === "split" ? "hidden xl:block" : ""} ${
                view === v ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <a href="/" target="_blank" className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100">
          View site <Icon name="external" className="w-3.5 h-3.5" />
        </a>
        <button
          type="button"
          onClick={discard}
          disabled={!dirty || saving}
          className="hidden sm:block rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={doSave}
          disabled={!dirty || saving}
          title="Save (Ctrl+S)"
          className="flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:bg-zinc-800 disabled:text-zinc-500 cursor-pointer disabled:cursor-default"
        >
          {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" /> : <Icon name="check" />}
          {saving ? "Saving" : "Save"}
          <kbd className="hidden lg:inline rounded bg-zinc-950/15 px-1.5 font-mono text-[10px]">⌘S</kbd>
        </button>
        <form action={logout} onSubmit={(e) => dirty && !confirm("You have unsaved changes. Sign out anyway?") && e.preventDefault()}>
          <button type="submit" title="Sign out" aria-label="Sign out" className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer">
            <Icon name="lock" />
          </button>
        </form>
      </header>

      {view === "preview" ? (
        <Preview data={data} className="h-[calc(100vh-4rem)]" />
      ) : (
        <div className={`grid lg:h-[calc(100vh-4rem)] lg:grid-cols-[17rem_minmax(0,1fr)] ${view === "split" ? "xl:grid-cols-[17rem_minmax(0,1fr)_minmax(0,1fr)]" : ""}`}>
          {/* Sidebar */}
          <aside className="flex flex-col gap-1 border-b border-zinc-800 p-3 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <SideItem active={selected === "profile"} onClick={() => setSelected("profile")}>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300"><Icon name="user" /></span>
              <span className="flex-1 truncate">Hero & profile</span>
            </SideItem>

            <div className="mt-4 mb-1 flex items-center justify-between px-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Sections</span>
              <span className="text-[11px] text-zinc-600">drag to reorder</span>
            </div>

            {data.sections.map((s, i) => (
              <div
                key={s.id}
                draggable
                onDragStart={(e) => {
                  setDragFrom(i);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(i);
                }}
                onDragLeave={() => setDragOver((o) => (o === i ? null : o))}
                onDrop={() => onDrop(i)}
                onDragEnd={() => {
                  setDragFrom(null);
                  setDragOver(null);
                }}
                className={`rounded-xl transition ${dragFrom === i ? "opacity-40" : ""} ${
                  dragOver === i && dragFrom !== i ? (dragFrom !== null && dragFrom < i ? "shadow-[0_2px_0_0_#34d399]" : "shadow-[0_-2px_0_0_#34d399]") : ""
                }`}
              >
                <SideItem active={selected === s.id} onClick={() => setSelected(s.id)} dim={!s.visible}>
                  <span className="cursor-grab text-zinc-600 active:cursor-grabbing"><Icon name="grip" /></span>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${typeColor[s.type]}`}>{s.type}</span>
                  <span className="flex-1 truncate">{s.title || "Untitled"}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    title={s.visible ? "Hide section" : "Show section"}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSection(s.id, { visible: !s.visible });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        updateSection(s.id, { visible: !s.visible });
                      }
                    }}
                    className="rounded-md p-1 text-zinc-500 opacity-60 transition hover:bg-zinc-700 hover:text-zinc-100 hover:opacity-100"
                  >
                    <Icon name={s.visible ? "eye" : "eyeOff"} className="w-3.5 h-3.5" />
                  </span>
                </SideItem>
              </div>
            ))}

            {adding ? (
              <div className="mt-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-2">
                <div className="mb-1 flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-semibold text-zinc-300">Add a section</span>
                  <IconButton icon="x" label="Close" onClick={() => setAdding(false)} />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {sectionTypes.map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => addSection(t.type)}
                      className="flex flex-col items-start gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-left transition hover:border-emerald-400/50 hover:bg-emerald-400/5 cursor-pointer"
                    >
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${typeColor[t.type]}`}>{t.label}</span>
                      <span className="text-[11px] leading-4 text-zinc-500">{t.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-2.5 text-sm font-medium text-zinc-400 transition hover:border-emerald-400/60 hover:bg-emerald-400/5 hover:text-emerald-300 cursor-pointer"
              >
                <Icon name="plus" /> Add section
              </button>
            )}
          </aside>

          {/* Form */}
          <main className="p-4 sm:p-6 lg:overflow-y-auto">
            <div className="mx-auto max-w-2xl">
              {selected === "profile" || !section ? (
                <ProfileForm profile={data.profile} update={updateProfile} />
              ) : (
                <SectionForm
                  key={section.id}
                  section={section}
                  index={data.sections.indexOf(section)}
                  count={data.sections.length}
                  update={(patch) => updateSection(section.id, patch)}
                  onMove={(dir) => {
                    const i = data.sections.indexOf(section);
                    setSections((ss) => move(ss, i, i + dir));
                  }}
                  onDuplicate={() => duplicateSection(section.id)}
                  onDelete={() => deleteSection(section.id)}
                />
              )}
            </div>
          </main>

          {view === "split" && <Preview data={data} className="hidden xl:block border-l border-zinc-800" />}
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-4 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${
            toast.tone === "error" ? "border-red-500/30 bg-red-950/90 text-red-200" : "border-zinc-700 bg-zinc-900/95 text-zinc-100"
          }`}
        >
          {toast.text}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action!.run();
                setToast(null);
              }}
              className="font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SideItem({ active, dim, onClick, children }: { active: boolean; dim?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick())}
      className={`group flex items-center gap-2 rounded-xl px-2 py-2 text-sm transition cursor-pointer ${
        active ? "bg-zinc-800/80 text-zinc-100 ring-1 ring-zinc-700" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
      } ${dim ? "opacity-50" : ""}`}
    >
      {children}
    </div>
  );
}

function Card({ title, desc, children, actions }: { title: string; desc?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {desc && <p className="mt-0.5 text-sm text-zinc-500">{desc}</p>}
        </div>
        {actions}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function ProfileForm({ profile, update }: { profile: Profile; update: (p: Partial<Profile>) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <Card title="Hero" desc="The first thing visitors see.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={profile.name} onChange={(name) => update({ name })} placeholder="Jane Doe" />
          <Field label="Role" value={profile.role} onChange={(role) => update({ role })} placeholder="Full-Stack Developer" />
        </div>
        <Field label="Tagline" value={profile.tagline} onChange={(tagline) => update({ tagline })} multiline rows={2} placeholder="One sentence about what you do." />
        <Field label="Status badge" value={profile.badge} onChange={(badge) => update({ badge })} placeholder="Available for new opportunities" hint="Leave empty to hide the badge." />
      </Card>
      <Card title="Contact links" desc="Used by the Contact section. Empty links are hidden.">
        <Field label="Email" type="email" value={profile.email} onChange={(email) => update({ email })} placeholder="you@example.com" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GitHub URL" value={profile.github} onChange={(github) => update({ github })} placeholder="https://github.com/you" />
          <Field label="LinkedIn URL" value={profile.linkedin} onChange={(linkedin) => update({ linkedin })} placeholder="https://linkedin.com/in/you" />
        </div>
      </Card>
    </div>
  );
}

function SectionForm({
  section: s,
  index,
  count,
  update,
  onMove,
  onDuplicate,
  onDelete,
}: {
  section: Section;
  index: number;
  count: number;
  update: (patch: Partial<Section>) => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const label = sectionTypes.find((t) => t.type === s.type)!;
  return (
    <div className="flex flex-col gap-6">
      <Card
        title={`${label.label} section`}
        desc={label.hint}
        actions={
          <div className="flex items-center">
            <IconButton icon={s.visible ? "eye" : "eyeOff"} label={s.visible ? "Hide section" : "Show section"} onClick={() => update({ visible: !s.visible })} />
            <IconButton icon="up" label="Move up" onClick={() => onMove(-1)} disabled={index === 0} />
            <IconButton icon="down" label="Move down" onClick={() => onMove(1)} disabled={index === count - 1} />
            <IconButton icon="copy" label="Duplicate section" onClick={onDuplicate} />
            <IconButton icon="trash" label="Delete section" danger onClick={onDelete} />
          </div>
        }
      >
        {!s.visible && <p className="rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-300">This section is hidden from your site.</p>}
        <Field label={s.type === "contact" ? "Heading" : "Title"} value={s.title} onChange={(title) => update({ title })} />
        {s.type === "contact" && (
          <>
            <Field label="Small label above heading" value={s.eyebrow} onChange={(eyebrow) => update({ eyebrow })} placeholder="What's next?" />
            <Field label="Message" value={s.body} onChange={(body) => update({ body })} multiline rows={3} hint="Buttons use the email and links from Hero & profile." />
          </>
        )}
        {s.type === "services" && (
          <Field label="Intro" value={s.intro} onChange={(intro) => update({ intro })} multiline rows={2} placeholder="A sentence shown under the title." />
        )}
        {(s.type === "about" || s.type === "text") && (
          <Field label="Text" value={s.body} onChange={(body) => update({ body })} multiline rows={7} hint="Leave a blank line between paragraphs." />
        )}
      </Card>

      {s.type === "about" && (
        <Card title="Highlights" desc="Short numbers shown next to your bio, e.g. 3+ / Years experience.">
          <ItemList
            grid
            items={s.stats}
            onChange={(stats) => update({ stats })}
            newItem={() => ({ value: "", label: "" })}
            addLabel="Add highlight"
            itemLabel={(x) => [x.value, x.label].filter(Boolean).join(" ")}
            render={(x, set) => (
              <>
                <Field label="Value" value={x.value} onChange={(value) => set({ value })} placeholder="3+" />
                <Field label="Label" value={x.label} onChange={(label) => set({ label })} placeholder="Years experience" />
              </>
            )}
          />
        </Card>
      )}

      {s.type === "skills" && (
        <Card title="Skill groups">
          <ItemList
            grid
            items={s.groups}
            onChange={(groups) => update({ groups })}
            newItem={() => ({ name: "", items: [] })}
            addLabel="Add group"
            itemLabel={(g) => g.name}
            render={(g, set) => (
              <>
                <Field label="Group name" value={g.name} onChange={(name) => set({ name })} placeholder="Frontend" />
                <TagInput label="Skills" value={g.items} onChange={(items) => set({ items })} />
              </>
            )}
          />
        </Card>
      )}

      {s.type === "projects" && (
        <Card title="Projects">
          <ItemList
            items={s.items}
            onChange={(items) => update({ items })}
            newItem={newProject}
            addLabel="Add project"
            itemLabel={(p) => p.title}
            render={(p, set) => (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Title" value={p.title} onChange={(title) => set({ title })} placeholder="My awesome app" />
                  <Field label="Link" value={p.href} onChange={(href) => set({ href })} placeholder="https://…" />
                </div>
                <Field label="Description" value={p.description} onChange={(description) => set({ description })} multiline rows={2} />
                <TagInput label="Tech tags" value={p.tags} onChange={(tags) => set({ tags })} />
              </>
            )}
          />
        </Card>
      )}

      {s.type === "services" && (
        <Card title="Services" desc="Each service gets a card with an optional link to its page.">
          <ItemList
            items={s.items}
            onChange={(items) => update({ items })}
            newItem={newService}
            addLabel="Add service"
            itemLabel={(v) => v.title}
            render={(v, set) => (
              <>
                <Field label="Service name" value={v.title} onChange={(title) => set({ title })} placeholder="Web Development" />
                <Field label="Description" value={v.description} onChange={(description) => set({ description })} multiline rows={3} placeholder="What's included and who it's for." />
                <TagInput label="What's included" value={v.features} onChange={(features) => set({ features })} placeholder="e.g. Responsive design, then Enter" />
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                  <Field label="Link" value={v.href} onChange={(href) => set({ href })} placeholder="/services/web or https://…" hint="A page on this site (starts with /) or a full URL. Leave empty for no button." />
                  <Field label="Button text" value={v.cta} onChange={(cta) => set({ cta })} placeholder="Learn more" />
                </div>
              </>
            )}
          />
        </Card>
      )}

      {s.type === "experience" && (
        <Card title="Roles" desc="Most recent first.">
          <ItemList
            items={s.items}
            onChange={(items) => update({ items })}
            newItem={newJob}
            addLabel="Add role"
            itemLabel={(j) => [j.role, j.company && `@ ${j.company}`].filter(Boolean).join(" ")}
            render={(j, set) => (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Role" value={j.role} onChange={(role) => set({ role })} placeholder="Software Engineer" />
                  <Field label="Company" value={j.company} onChange={(company) => set({ company })} placeholder="Acme Inc." />
                  <Field label="Period" value={j.period} onChange={(period) => set({ period })} placeholder="2024 — Present" />
                </div>
                <Field label="What you did" value={j.note} onChange={(note) => set({ note })} multiline rows={2} />
              </>
            )}
          />
        </Card>
      )}
    </div>
  );
}

// Renders the real page at desktop width, scaled down to fit the pane.
const PREVIEW_WIDTH = 1280;

function Preview({ data, className = "" }: { data: Portfolio; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const o = outer.current!;
    const i = inner.current!;
    const measure = () => {
      const s = Math.min(1, o.clientWidth / PREVIEW_WIDTH);
      setScale(s);
      setHeight(i.offsetHeight * s);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outer} className={`relative overflow-y-auto overflow-x-hidden bg-zinc-900 lg:h-[calc(100vh-4rem)] ${className}`}>
      <div className="pointer-events-none sticky top-3 z-50 flex justify-end px-3 h-0">
        <span className="rounded-full bg-zinc-800/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 backdrop-blur">Live preview</span>
      </div>
      <div style={{ height }}>
        <div
          ref={inner}
          style={{ width: PREVIEW_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}
          // Links inside the preview shouldn't navigate away from the editor.
          onClickCapture={(e) => {
            if ((e.target as HTMLElement).closest("a")) e.preventDefault();
          }}
        >
          <PortfolioView data={data} />
        </div>
      </div>
    </div>
  );
}
