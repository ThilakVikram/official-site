"use server";

import { revalidatePath } from "next/cache";
import { savePortfolio } from "@/database/lib/portfolio";
import { normalizePortfolio } from "@/app/_portfolio/content";
import { isAdmin } from "@/app/_auth/session";

export async function save(data: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Your session has expired. Reload and sign in again." };
  try {
    await savePortfolio(normalizePortfolio(data));
  } catch (e) {
    console.error("Failed to save portfolio", e);
    return { ok: false, error: "Could not save to the database." };
  }
  revalidatePath("/");
  return { ok: true };
}
