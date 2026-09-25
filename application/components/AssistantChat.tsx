"use client";

import { useEffect, useRef, useState } from "react";

// Floating chat that talks to the personal RAG assistant (/api/personal_assistant).

type Message = { role: "user" | "assistant"; content: string; error?: boolean };

const SUGGESTIONS = ["What does he/she/they do?", "What are the main skills?", "Tell me about recent projects", "How can I get in touch?"];

export default function AssistantChat({ ownerName, endpoint = "/api/personal_assistant" }: { ownerName: string; endpoint?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const name = ownerName.trim() || "me";
  const firstName = name.split(/\s+/)[0];
  const suggestions = SUGGESTIONS.map((s) => s.replace("he/she/they", firstName).replace("the main", `${firstName}'s main`));

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const history = messages.filter((m) => !m.error).map(({ role, content }) => ({ role, content }));
    setMessages((ms) => [...ms, { role: "user", content: question }, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const setLast = (fn: (m: Message) => Message) => setMessages((ms) => [...ms.slice(0, -1), fn(ms[ms.length - 1])]);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setLast((m) => ({ ...m, content: m.content + chunk }));
      }
    } catch (e) {
      if (controller.signal.aborted) {
        setLast((m) => (m.content ? m : { ...m, content: "Stopped.", error: true }));
      } else {
        setLast(() => ({ role: "assistant", content: e instanceof Error ? e.message : "Something went wrong.", error: true }));
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : `Ask AI about ${name}`}
        aria-expanded={open}
        className={`group fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 p-3.5 font-semibold text-zinc-950 shadow-2xl shadow-emerald-500/30 transition hover:scale-105 active:scale-95 cursor-pointer sm:px-5 sm:py-3.5 ${
          open ? "max-sm:hidden" : ""
        }`}
      >
        {!open && <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-emerald-400/40 [animation-duration:2.5s]" />}
        {open ? <CloseIcon /> : <SparkIcon />}
        <span className="hidden sm:inline text-sm">{open ? "Close" : `Ask AI about ${firstName}`}</span>
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label={`Chat with ${name}'s AI assistant`}
          className="fixed inset-x-3 bottom-3 top-16 z-50 flex flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/95 text-zinc-100 shadow-2xl shadow-black/60 backdrop-blur-xl sm:inset-x-auto sm:top-auto sm:right-5 sm:bottom-24 sm:h-[min(36rem,calc(100vh-8rem))] sm:w-[24rem]"
        >
          <header className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
            <span className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-zinc-950">
              <SparkIcon />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-950 bg-emerald-400" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Ask about {name}</p>
              <p className="truncate text-xs text-zinc-500">AI assistant · answers from {firstName}&apos;s profile</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  abortRef.current?.abort();
                  setMessages([]);
                }}
                className="rounded-lg px-2 py-1 text-xs text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
              >
                Clear
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer">
              <CloseIcon />
            </button>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col justify-end gap-4">
                <div className="rounded-2xl rounded-bl-md bg-zinc-900 px-4 py-3 text-sm leading-6 text-zinc-300">
                  Hi! 👋 I can answer questions about {name}&apos;s skills, experience and projects. What would you like to know?
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-emerald-400/50 hover:text-emerald-300 cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {messages.map((m, i) => (
                  <li key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                        m.role === "user"
                          ? "rounded-br-md bg-emerald-400 text-zinc-950"
                          : m.error
                            ? "rounded-bl-md border border-red-500/30 bg-red-500/10 text-red-200"
                            : "rounded-bl-md bg-zinc-900 text-zinc-200"
                      }`}
                    >
                      {m.role === "assistant" && !m.content ? <TypingDots /> : m.role === "assistant" ? <Formatted text={m.content} /> : m.content}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-zinc-800 p-3"
          >
            <div className="flex items-end gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5 transition focus-within:border-emerald-400/60 focus-within:ring-4 focus-within:ring-emerald-400/10">
              <textarea
                ref={inputRef}
                value={input}
                rows={1}
                maxLength={1000}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder={`Ask anything about ${firstName}…`}
                className="max-h-30 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none"
              />
              {busy ? (
                <button type="button" onClick={() => abortRef.current?.abort()} aria-label="Stop" className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-700 text-zinc-100 transition hover:bg-zinc-600 cursor-pointer">
                  <span className="h-3 w-3 rounded-sm bg-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Send"
                  className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400 text-zinc-950 transition hover:bg-emerald-300 disabled:bg-zinc-800 disabled:text-zinc-600 cursor-pointer disabled:cursor-default"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0-6 6m6-6 6 6" />
                  </svg>
                </button>
              )}
            </div>
            <p className="mt-2 text-center text-[10px] text-zinc-600">AI answers can be wrong. Please verify important details.</p>
          </form>
        </div>
      )}
    </>
  );
}

// Minimal Markdown: paragraphs, "-"/"*" bullets and **bold**. Built with React
// elements, so model output is never injected as HTML.
function Formatted({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={blocks.length} className="my-1 list-disc space-y-1 pl-5 marker:text-emerald-400">
          {bullets.map((b, i) => <li key={i}>{bold(b)}</li>)}
        </ul>,
      );
      bullets = [];
    }
  };
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*[-*•]\s+(.*)/);
    if (m) {
      bullets.push(m[1]);
      continue;
    }
    flush();
    if (line.trim()) blocks.push(<p key={blocks.length}>{bold(line)}</p>);
  }
  flush();
  return <div className="space-y-2 break-words">{blocks}</div>;
}

function bold(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i} className="font-semibold text-zinc-50">{part.slice(2, -2)}</strong> : part,
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1 py-2" aria-label="Thinking">
      {[0, 150, 300].map((d) => (
        <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  );
}

function SparkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
