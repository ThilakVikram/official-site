// Shared by the admin page, its client UI and its server actions.

export type PersonalDataEntry = {
  id: string;
  category: string;
  title: string;
  content: string;
  syncedAt: string | null;
  updatedAt: string;
};

export type EntryInput = { category: string; title: string; content: string };

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

// Suggested categories; any other value can be typed in.
export const categories = ["about", "skill", "experience", "project", "education", "email", "contact", "other"];

export const LIMITS = { category: 50, title: 191, content: 5000 };
