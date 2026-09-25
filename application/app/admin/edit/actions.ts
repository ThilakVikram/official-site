"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { savePortfolio } from "@/database/lib/portfolio";
import { normalizePortfolio } from "@/app/_portfolio/content";

// Editing is protected by the EDIT_PASSWORD environment variable.
// Unlocking stores an HMAC of the password in an httpOnly cookie, so changing
// the password signs every editor out.
const COOKIE = "portfolio_editor";

function sessionToken(password: string) {
  return createHmac("sha256", password).update("portfolio-editor").digest("hex");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function isEditor() {
  const password = process.env.EDIT_PASSWORD;
  if (!password) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  return !!value && safeEqual(value, sessionToken(password));
}

export async function unlock(_: string | null, formData: FormData): Promise<string | null> {
  const password = process.env.EDIT_PASSWORD;
  if (!password) return "Editing is disabled: EDIT_PASSWORD is not set on the server.";
  if (!safeEqual(String(formData.get("password") ?? ""), password)) return "Wrong password.";
  (await cookies()).set(COOKIE, sessionToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  revalidatePath("/edit");
  return null;
}

export async function lock() {
  (await cookies()).delete(COOKIE);
  revalidatePath("/edit");
}

export async function save(data: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isEditor())) return { ok: false, error: "Your session has expired. Reload and unlock again." };
  try {
    await savePortfolio(normalizePortfolio(data));
  } catch (e) {
    console.error("Failed to save portfolio", e);
    return { ok: false, error: "Could not save to the database." };
  }
  revalidatePath("/");
  return { ok: true };
}
