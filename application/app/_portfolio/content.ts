// Shape of the portfolio page stored in the `portfolio` table (see database/schema/index.prisma).
// Shared by the public page, the /edit editor and the save action.

export type Profile = {
  name: string;
  role: string;
  tagline: string;
  badge: string;
  email: string;
  github: string;
  linkedin: string;
};

export type Stat = { value: string; label: string };
export type SkillGroup = { name: string; items: string[] };
export type Project = { title: string; description: string; tags: string[]; href: string };
export type Job = { period: string; role: string; company: string; note: string };
export type Service = { title: string; description: string; features: string[]; href: string; cta: string };

type Base = { id: string; title: string; visible: boolean };

export type AboutSection = Base & { type: "about"; body: string; stats: Stat[] };
export type SkillsSection = Base & { type: "skills"; groups: SkillGroup[] };
export type ProjectsSection = Base & { type: "projects"; items: Project[] };
export type ServicesSection = Base & { type: "services"; intro: string; items: Service[] };
export type ExperienceSection = Base & { type: "experience"; items: Job[] };
export type TextSection = Base & { type: "text"; body: string };
export type ContactSection = Base & { type: "contact"; eyebrow: string; body: string };

export type Section =
  | AboutSection
  | SkillsSection
  | ProjectsSection
  | ServicesSection
  | ExperienceSection
  | TextSection
  | ContactSection;

export type SectionType = Section["type"];

export type Portfolio = { profile: Profile; sections: Section[] };

// Works on plain http too, unlike crypto.randomUUID().
export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export const sectionTypes: { type: SectionType; label: string; hint: string }[] = [
  { type: "about", label: "About", hint: "Bio with highlight numbers" },
  { type: "skills", label: "Skills", hint: "Grouped skill tags" },
  { type: "projects", label: "Projects", hint: "Project cards with links" },
  { type: "services", label: "Services", hint: "What you offer, with links" },
  { type: "experience", label: "Experience", hint: "Timeline of roles" },
  { type: "text", label: "Text", hint: "Free-form paragraph block" },
  { type: "contact", label: "Contact", hint: "Call to action with links" },
];

export function newSection(type: SectionType): Section {
  const base = { id: newId(), visible: true };
  switch (type) {
    case "about":
      return { ...base, type, title: "About me", body: "", stats: [{ value: "", label: "" }] };
    case "skills":
      return { ...base, type, title: "Skills & tools", groups: [{ name: "", items: [] }] };
    case "projects":
      return { ...base, type, title: "Projects", items: [newProject()] };
    case "services":
      return { ...base, type, title: "Services", intro: "", items: [newService()] };
    case "experience":
      return { ...base, type, title: "Experience", items: [newJob()] };
    case "text":
      return { ...base, type, title: "New section", body: "" };
    case "contact":
      return { ...base, type, title: "Let's build something together.", eyebrow: "What's next?", body: "" };
  }
}

export const newProject = (): Project => ({ title: "", description: "", tags: [], href: "" });
export const newJob = (): Job => ({ period: "", role: "", company: "", note: "" });
export const newService = (): Service => ({ title: "", description: "", features: [], href: "", cta: "Learn more" });

export const defaultPortfolio: Portfolio = {
  profile: {
    name: "Thilak Vikram R",
    role: "Full-Stack Developer",
    tagline: "I build fast, reliable web apps and automate the boring stuff.",
    badge: "Available for new opportunities",
    email: "you@example.com",
    github: "https://github.com/",
    linkedin: "https://www.linkedin.com/",
  },
  sections: [
    {
      id: "about",
      type: "about",
      title: "About me",
      visible: true,
      body:
        "I'm a developer who enjoys turning ideas into clean, maintainable products. I care about performance, accessibility and developer experience.\n\nWhen I'm not building web apps, I'm writing automation that saves teams hours every week.",
      stats: [
        { value: "3+", label: "Years experience" },
        { value: "20+", label: "Projects shipped" },
        { value: "10+", label: "Happy clients" },
      ],
    },
    {
      id: "skills",
      type: "skills",
      title: "Skills & tools",
      visible: true,
      groups: [
        { name: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
        { name: "Backend", items: ["Node.js", "Prisma", "PostgreSQL", "REST / GraphQL"] },
        { name: "Automation", items: ["Python", "Selenium", "Playwright", "CI/CD"] },
        { name: "Tools", items: ["Git", "Docker", "AWS", "Linux"] },
      ],
    },
    {
      id: "projects",
      type: "projects",
      title: "Featured projects",
      visible: true,
      items: [
        { title: "Project One", description: "A short description of what this project does and the problem it solves.", tags: ["Next.js", "Prisma", "PostgreSQL"], href: "" },
        { title: "Project Two", description: "A short description of what this project does and the problem it solves.", tags: ["React", "Node.js", "Docker"], href: "" },
        { title: "Project Three", description: "A short description of what this project does and the problem it solves.", tags: ["Python", "Playwright", "CI/CD"], href: "" },
      ],
    },
    {
      id: "services",
      type: "services",
      title: "Services",
      visible: true,
      intro: "Here's how I can help you ship.",
      items: [
        { title: "Web Development", description: "Fast, accessible websites and web apps built with modern tooling.", features: ["Next.js & React", "Responsive design", "SEO-friendly"], href: "", cta: "Learn more" },
        { title: "Test Automation", description: "Reliable end-to-end and API test suites that catch bugs before your users do.", features: ["Playwright / Selenium", "CI integration", "Reports"], href: "", cta: "Learn more" },
        { title: "Backend & APIs", description: "Secure, well-documented APIs and databases that scale with you.", features: ["REST / GraphQL", "Prisma & SQL", "Auth"], href: "", cta: "Learn more" },
      ],
    },
    {
      id: "experience",
      type: "experience",
      title: "Experience",
      visible: true,
      items: [
        { period: "2024 — Present", role: "Software Engineer", company: "Company Name", note: "What you work on and the impact you've had." },
        { period: "2022 — 2024", role: "Automation Engineer", company: "Company Name", note: "What you worked on and the impact you had." },
      ],
    },
    {
      id: "contact",
      type: "contact",
      title: "Let's build something together.",
      visible: true,
      eyebrow: "What's next?",
      body: "My inbox is always open — whether you have a project in mind, a question, or just want to say hi.",
    },
  ],
};

// ---- Validation -------------------------------------------------------------
// Coerces untrusted input (request body or stored JSON) into a valid Portfolio.

const MAX_SECTIONS = 30;
const MAX_ITEMS = 50;

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function list<T>(v: unknown, map: (x: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, MAX_ITEMS)
    .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
    .map(map);
}

function tags(v: unknown): string[] {
  return Array.isArray(v) ? v.slice(0, MAX_ITEMS).map((t) => str(t, 60)).filter(Boolean) : [];
}

// Only allow link schemes that can't run script on the public page.
export function safeHref(v: unknown): string {
  const s = str(v, 500).trim();
  if (s === "" || s.startsWith("#") || (s.startsWith("/") && !s.startsWith("//"))) return s;
  try {
    const url = new URL(s);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? s : "";
  } catch {
    return "";
  }
}

function section(x: Record<string, unknown>): Section | null {
  const base = {
    id: str(x.id, 40).replace(/[^a-zA-Z0-9_-]/g, "") || newId(),
    title: str(x.title),
    visible: x.visible !== false,
  };
  switch (x.type) {
    case "about":
      return { ...base, type: "about", body: str(x.body, 5000), stats: list(x.stats, (s) => ({ value: str(s.value, 20), label: str(s.label, 60) })) };
    case "skills":
      return { ...base, type: "skills", groups: list(x.groups, (g) => ({ name: str(g.name, 60), items: tags(g.items) })) };
    case "projects":
      return {
        ...base,
        type: "projects",
        items: list(x.items, (p) => ({ title: str(p.title), description: str(p.description, 1000), tags: tags(p.tags), href: safeHref(p.href) })),
      };
    case "services":
      return {
        ...base,
        type: "services",
        intro: str(x.intro, 1000),
        items: list(x.items, (v) => ({
          title: str(v.title),
          description: str(v.description, 1000),
          features: tags(v.features),
          href: safeHref(v.href),
          cta: str(v.cta, 40),
        })),
      };
    case "experience":
      return {
        ...base,
        type: "experience",
        items: list(x.items, (j) => ({ period: str(j.period, 60), role: str(j.role), company: str(j.company), note: str(j.note, 1000) })),
      };
    case "text":
      return { ...base, type: "text", body: str(x.body, 5000) };
    case "contact":
      return { ...base, type: "contact", eyebrow: str(x.eyebrow, 60), body: str(x.body, 1000) };
    default:
      return null;
  }
}

export function normalizePortfolio(input: unknown): Portfolio {
  if (typeof input !== "object" || input === null) return defaultPortfolio;
  const raw = input as Record<string, unknown>;
  const p = (typeof raw.profile === "object" && raw.profile !== null ? raw.profile : {}) as Record<string, unknown>;

  const seen = new Set<string>();
  const sections = (Array.isArray(raw.sections) ? raw.sections : [])
    .slice(0, MAX_SECTIONS)
    .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
    .map(section)
    .filter((s): s is Section => s !== null)
    .map((s) => {
      // Section ids are used as page anchors, so keep them unique.
      if (seen.has(s.id)) s = { ...s, id: newId() };
      seen.add(s.id);
      return s;
    });

  return {
    profile: {
      name: str(p.name, 80),
      role: str(p.role, 80),
      tagline: str(p.tagline, 300),
      badge: str(p.badge, 80),
      email: str(p.email, 120).replace(/[^\w.+@-]/g, ""),
      github: safeHref(p.github),
      linkedin: safeHref(p.linkedin),
    },
    sections,
  };
}
