import type { AboutSection, ContactSection, ExperienceSection, Portfolio, Profile, ProjectsSection, Section, ServicesSection, SkillsSection, TextSection } from "./content";

// Renders the public portfolio page. No hooks, so it works both as a Server
// Component (app/page.tsx) and inside the editor's live preview.
export default function PortfolioView({ data }: { data: Portfolio }) {
  const { profile } = data;
  const sections = data.sections.filter((s) => s.visible);
  const projects = sections.find((s) => s.type === "projects");
  const contact = sections.find((s) => s.type === "contact");

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-400 selection:text-zinc-950">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/70 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <a href="#" className="truncate font-mono text-sm tracking-widest text-emerald-400">
            &lt;{profile.name || "Portfolio"} /&gt;
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            {sections.filter((s) => s.type !== "contact" && s.title).map((s) => (
              <a key={s.id} href={`#${s.id}`} className="transition-colors hover:text-emerald-400">
                {s.title}
              </a>
            ))}
            {contact && (
              <a href={`#${contact.id}`} className="transition-colors hover:text-emerald-400">
                Contact
              </a>
            )}
          </div>
          <a
            href="/auth/login"
            className="shrink-0 rounded-full border border-zinc-700 px-5 py-2 text-sm font-medium transition hover:border-emerald-400 hover:text-emerald-400"
          >
            Log In
          </a>
        </nav>
      </header>

      <main>
        <Hero profile={profile} projectsId={projects?.id} contactId={contact?.id} />
        {sections.map((s, i) => (
          <SectionBlock key={s.id} section={s} index={i + 1} profile={profile} />
        ))}
      </main>

      <footer className="border-t border-zinc-800/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-zinc-500 sm:flex-row">
          <span>© {new Date().getFullYear()} {profile.name}. All rights reserved.</span>
          <span className="font-mono">Built with Next.js & Tailwind CSS</span>
        </div>
      </footer>
    </div>
  );
}

function Hero({ profile, projectsId, contactId }: { profile: Profile; projectsId?: string; contactId?: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute top-20 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start px-6 pt-28 pb-32 md:pt-40 md:pb-44">
        {profile.badge && (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-medium text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {profile.badge}
          </span>
        )}
        <h1 className="mt-8 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          Hi, I&apos;m {profile.name}.
          {profile.role && (
            <>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300">
                {profile.role}.
              </span>
            </>
          )}
        </h1>
        {profile.tagline && <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">{profile.tagline}</p>}
        <div className="mt-10 flex flex-wrap gap-4">
          {projectsId && (
            <a
              href={`#${projectsId}`}
              className="group flex items-center gap-3 rounded-full bg-emerald-400 pl-6 pr-2 py-2 font-semibold text-zinc-950 transition hover:bg-emerald-300"
            >
              View my work
              <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-950 text-emerald-400 transition-transform group-hover:translate-x-1">→</span>
            </a>
          )}
          {contactId && (
            <a
              href={`#${contactId}`}
              className="flex items-center rounded-full border border-zinc-700 px-6 py-2 font-semibold transition hover:border-emerald-400 hover:text-emerald-400"
            >
              Get in touch
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function SectionBlock({ section, index, profile }: { section: Section; index: number; profile: Profile }) {
  const num = String(index).padStart(2, "0");
  switch (section.type) {
    case "about":
      return <About s={section} num={num} />;
    case "skills":
      return <Skills s={section} num={num} />;
    case "projects":
      return <Projects s={section} num={num} />;
    case "services":
      return <Services s={section} num={num} />;
    case "experience":
      return <Experience s={section} num={num} />;
    case "text":
      return <Text s={section} num={num} />;
    case "contact":
      return <Contact s={section} num={num} profile={profile} />;
  }
}

function Shell({ id, num, title, children }: { id: string; num: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
      <div className="mb-12 flex items-center gap-4">
        <span className="font-mono text-sm text-emerald-400">{num}.</span>
        <h2 className="text-3xl font-bold md:text-4xl">{title}</h2>
        <span className="h-px flex-1 bg-gradient-to-r from-zinc-700 to-transparent" />
      </div>
      {children}
    </section>
  );
}

function Paragraphs({ text, className }: { text: string; className: string }) {
  return (
    <div className={className}>
      {text.split(/\n\s*\n/).filter((p) => p.trim()).map((p, i) => (
        <p key={i} className="whitespace-pre-line">{p}</p>
      ))}
    </div>
  );
}

function About({ s, num }: { s: AboutSection; num: string }) {
  const stats = s.stats.filter((x) => x.value || x.label);
  return (
    <Shell id={s.id} num={num} title={s.title}>
      <div className="grid gap-12 md:grid-cols-5">
        <Paragraphs text={s.body} className={`${stats.length ? "md:col-span-3" : "md:col-span-5"} space-y-5 text-lg leading-8 text-zinc-400`} />
        {stats.length > 0 && (
          <div className="md:col-span-2 grid grid-cols-3 gap-4 content-start">
            {stats.map((x, i) => (
              <div key={i} className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-center">
                <span className="text-3xl font-bold text-emerald-400">{x.value}</span>
                <span className="mt-1 text-xs text-zinc-500">{x.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

function Skills({ s, num }: { s: SkillsSection; num: string }) {
  return (
    <Shell id={s.id} num={num} title={s.title}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {s.groups.map((g, i) => (
          <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:border-emerald-400/40">
            <h3 className="font-mono text-sm tracking-widest text-emerald-400">{g.name.toUpperCase()}</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {g.items.map((item, j) => (
                <li key={j} className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function Projects({ s, num }: { s: ProjectsSection; num: string }) {
  return (
    <Shell id={s.id} num={num} title={s.title}>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {s.items.map((p, i) => {
          const body = (
            <>
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-400/0 blur-2xl transition duration-500 group-hover:bg-emerald-400/20" />
              <div className="mb-6 h-36 rounded-xl bg-gradient-to-br from-emerald-500/20 via-zinc-800 to-cyan-500/20" />
              <h3 className="text-xl font-semibold transition-colors group-hover:text-emerald-400">
                {p.title} {p.href && <span className="inline-block transition-transform group-hover:translate-x-1">↗</span>}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">{p.description}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {p.tags.map((t, j) => (
                  <li key={j} className="font-mono text-xs text-emerald-300/80">#{t}</li>
                ))}
              </ul>
            </>
          );
          const cls = "group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/50";
          return p.href ? (
            <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
          ) : (
            <div key={i} className={cls}>{body}</div>
          );
        })}
      </div>
    </Shell>
  );
}

function Services({ s, num }: { s: ServicesSection; num: string }) {
  return (
    <Shell id={s.id} num={num} title={s.title}>
      {s.intro && <p className="-mt-6 mb-12 max-w-2xl text-lg text-zinc-400">{s.intro}</p>}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {s.items.map((v, i) => {
          // Internal routes open in the same tab, external links in a new one.
          const external = /^(https?:|mailto:)/.test(v.href);
          return (
            <div
              key={i}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7 transition duration-300 hover:border-emerald-400/50"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/0 to-transparent transition duration-500 group-hover:via-emerald-400/70" />
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 font-mono text-sm font-semibold text-emerald-300">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 text-xl font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{v.description}</p>
              {v.features.length > 0 && (
                <ul className="mt-5 flex flex-col gap-2">
                  {v.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex-1" />
              {v.href && (
                <a
                  href={v.href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="mt-7 inline-flex items-center gap-2 self-start text-sm font-semibold text-emerald-400 transition hover:text-emerald-300"
                >
                  {v.cta || "Learn more"}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

function Experience({ s, num }: { s: ExperienceSection; num: string }) {
  return (
    <Shell id={s.id} num={num} title={s.title}>
      <ol className="relative ml-3 border-l border-zinc-800">
        {s.items.map((e, i) => (
          <li key={i} className="relative mb-12 pl-8 last:mb-0">
            <span className="absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-emerald-400 bg-zinc-950" />
            <span className="font-mono text-xs tracking-wider text-zinc-500">{e.period}</span>
            <h3 className="mt-1 text-xl font-semibold">
              {e.role} {e.company && <span className="text-emerald-400">@ {e.company}</span>}
            </h3>
            <p className="mt-2 max-w-2xl text-zinc-400">{e.note}</p>
          </li>
        ))}
      </ol>
    </Shell>
  );
}

function Text({ s, num }: { s: TextSection; num: string }) {
  return (
    <Shell id={s.id} num={num} title={s.title}>
      <Paragraphs text={s.body} className="max-w-3xl space-y-5 text-lg leading-8 text-zinc-400" />
    </Shell>
  );
}

function Contact({ s, num, profile }: { s: ContactSection; num: string; profile: Profile }) {
  const outline = "rounded-full border border-zinc-700 px-8 py-3 font-semibold transition hover:border-emerald-400 hover:text-emerald-400";
  return (
    <section id={s.id} className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 px-8 py-16 text-center md:px-16">
        <div className="absolute -bottom-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <span className="relative font-mono text-sm tracking-widest text-emerald-400">
          {num}. {s.eyebrow.toUpperCase()}
        </span>
        <h2 className="relative mt-4 text-4xl font-bold md:text-5xl">{s.title}</h2>
        {s.body && <p className="relative mx-auto mt-4 max-w-lg text-zinc-400">{s.body}</p>}
        <div className="relative mt-10 flex flex-wrap justify-center gap-4">
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="rounded-full bg-emerald-400 px-8 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300">
              Say hello
            </a>
          )}
          {profile.github && <a href={profile.github} target="_blank" rel="noopener noreferrer" className={outline}>GitHub</a>}
          {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className={outline}>LinkedIn</a>}
        </div>
      </div>
    </section>
  );
}
