"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/auth/actions";
import type { CurrentUser } from "@/app/_auth/session";

const icons = {
  pencil: <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />,
  database: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />,
  settings: <><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></>,
  logout: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />,
};

function Icon({ name }: { name: keyof typeof icons }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0">
      {icons[name]}
    </svg>
  );
}

const itemClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer";

// Profile button in the site nav for a signed-in user, with a dropdown for
// account details, admin links (admins only) and signing out.
export default function UserMenu({ user }: { user: CurrentUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const displayName = user.name || user.userName;
  const initials = displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${displayName}`}
        className="flex items-center gap-2 rounded-full border border-zinc-700 py-1 pl-1 pr-3 text-sm font-medium transition hover:border-emerald-400 cursor-pointer"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 font-mono text-xs font-bold text-zinc-950">
          {initials}
        </span>
        <span className="hidden max-w-32 truncate sm:block">{displayName}</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 rounded-2xl border border-zinc-800 bg-zinc-900/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-lg">
          <div className="px-3 py-2">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-zinc-100">{displayName}</p>
              {user.isAdmin && (
                <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-mono text-[10px] tracking-wider text-emerald-400">ADMIN</span>
              )}
            </div>
            <p className="truncate text-xs text-zinc-500">@{user.userName}</p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>

          {user.isAdmin && (
            <>
              <div className="my-1 h-px bg-zinc-800" />
              <p className="px-3 pt-1 pb-1 font-mono text-[10px] tracking-widest text-zinc-500">ADMIN PANEL</p>
              <Link role="menuitem" href="/admin/edit" className={itemClass}>
                <Icon name="pencil" /> Edit portfolio
              </Link>
              <Link role="menuitem" href="/admin/personal_data" className={itemClass}>
                <Icon name="database" /> Personal data
              </Link>
              <Link role="menuitem" href="/admin/settings" className={itemClass}>
                <Icon name="settings" /> Settings
              </Link>
            </>
          )}

          <div className="my-1 h-px bg-zinc-800" />
          <form action={logout}>
            <button role="menuitem" type="submit" className={`${itemClass} hover:!text-red-300`}>
              <Icon name="logout" /> Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
