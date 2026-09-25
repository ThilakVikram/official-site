"use server";

import { revalidatePath } from "next/cache";
import { isEditor } from "@/app/admin/edit/actions";
import { createPersonalData, deletePersonalData, updatePersonalData } from "@/database/lib/personal_data";
import { LIMITS, type ActionResult, type EntryInput, type PersonalDataEntry } from "./types";

const MAX_BATCH = 50;

async function guard(): Promise<ActionResult<never> | null> {
  return (await isEditor()) ? null : { ok: false, error: "Your session has expired. Reload and unlock again." };
}

// Server Actions can be called with any payload, so re-validate here.
function clean(input: unknown): EntryInput | null {
  if (typeof input !== "object" || input === null) return null;
  const x = input as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const entry = {
    category: str(x.category, LIMITS.category).toLowerCase(),
    title: str(x.title, LIMITS.title),
    content: str(x.content, LIMITS.content),
  };
  return entry.category && entry.content ? entry : null;
}

function failure(what: string, e: unknown): ActionResult<never> {
  console.error(`Failed to ${what} personal data`, e);
  return { ok: false, error: `Could not ${what} the entry. Is the vector database running (npm run vdb:serve)?` };
}

export async function createEntries(entries: unknown[]): Promise<ActionResult<PersonalDataEntry[]>> {
  const denied = await guard();
  if (denied) return denied;
  if (!Array.isArray(entries) || entries.length > MAX_BATCH) return { ok: false, error: `Add up to ${MAX_BATCH} entries at a time.` };
  const valid = entries.map(clean);
  if (!valid.length || valid.some((e) => !e)) return { ok: false, error: "Every entry needs a category and details." };
  try {
    const data = await createPersonalData(valid as EntryInput[]);
    revalidatePath("/admin/personal_data");
    return { ok: true, data };
  } catch (e) {
    return failure("save", e);
  }
}

export async function updateEntry(id: string, entry: unknown): Promise<ActionResult<PersonalDataEntry>> {
  const denied = await guard();
  if (denied) return denied;
  const valid = clean(entry);
  if (typeof id !== "string" || !valid) return { ok: false, error: "Category and details are required." };
  try {
    const data = await updatePersonalData(id, valid);
    if (!data) return { ok: false, error: "This entry no longer exists. Reload the page." };
    revalidatePath("/admin/personal_data");
    return { ok: true, data };
  } catch (e) {
    return failure("update", e);
  }
}

export async function deleteEntry(id: string): Promise<ActionResult<null>> {
  const denied = await guard();
  if (denied) return denied;
  if (typeof id !== "string") return { ok: false, error: "Invalid entry." };
  try {
    await deletePersonalData(id);
    revalidatePath("/admin/personal_data");
    return { ok: true, data: null };
  } catch (e) {
    return failure("delete", e);
  }
}
