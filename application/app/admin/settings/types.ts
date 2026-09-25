// Shared by the settings page, its client UI and its server actions.

export type ApiKeyEntry = {
  id: number;
  label: string;
  key: string;
  isActive: boolean;
  updatedAt: string;
};

export type ApiKeyInput = { label: string; key: string };

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export const LIMITS = { label: 100, key: 255 };
