"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/app/_auth/session";
import {
  activateGoogleApiKey,
  createGoogleApiKey,
  deleteGoogleApiKey,
  listGoogleApiKeys,
  updateGoogleApiKey,
} from "@/database/lib/google_api_keys";
import { LIMITS, type ActionResult, type ApiKeyEntry, type ApiKeyInput } from "./types";

async function guard(): Promise<ActionResult<never> | null> {
  return (await isAdmin()) ? null : { ok: false, error: "Your session has expired. Reload and sign in again." };
}

// Server Actions can be called with any payload, so re-validate here.
function clean(input: unknown): ApiKeyInput | null {
  if (typeof input !== "object" || input === null) return null;
  const x = input as Record<string, unknown>;
  const label = typeof x.label === "string" ? x.label.trim().slice(0, LIMITS.label) : "";
  const key = typeof x.key === "string" ? x.key.trim() : "";
  if (!key || key.length > LIMITS.key || /\s/.test(key)) return null;
  return { label: label || "Untitled key", key };
}

function failure(what: string, e: unknown): ActionResult<never> {
  console.error(`Failed to ${what} Google API key`, e);
  return { ok: false, error: `Could not ${what} the key. Please try again.` };
}

// Every change returns the full list, since activating one key deactivates another.
async function done(): Promise<ActionResult<ApiKeyEntry[]>> {
  revalidatePath("/admin/settings");
  return { ok: true, data: await listGoogleApiKeys() };
}

export async function addKey(input: unknown): Promise<ActionResult<ApiKeyEntry[]>> {
  const denied = await guard();
  if (denied) return denied;
  const valid = clean(input);
  if (!valid) return { ok: false, error: "Paste a valid API key (no spaces)." };
  try {
    await createGoogleApiKey(valid);
    return await done();
  } catch (e) {
    return failure("save", e);
  }
}

export async function editKey(id: number, input: unknown): Promise<ActionResult<ApiKeyEntry[]>> {
  const denied = await guard();
  if (denied) return denied;
  const valid = clean(input);
  if (!Number.isInteger(id) || !valid) return { ok: false, error: "Paste a valid API key (no spaces)." };
  try {
    if (!(await updateGoogleApiKey(id, valid))) return { ok: false, error: "This key no longer exists. Reload the page." };
    return await done();
  } catch (e) {
    return failure("update", e);
  }
}

export async function activateKey(id: number): Promise<ActionResult<ApiKeyEntry[]>> {
  const denied = await guard();
  if (denied) return denied;
  if (!Number.isInteger(id)) return { ok: false, error: "Invalid key." };
  try {
    if (!(await activateGoogleApiKey(id))) return { ok: false, error: "This key no longer exists. Reload the page." };
    return await done();
  } catch (e) {
    return failure("switch to", e);
  }
}

export async function removeKey(id: number): Promise<ActionResult<ApiKeyEntry[]>> {
  const denied = await guard();
  if (denied) return denied;
  if (!Number.isInteger(id)) return { ok: false, error: "Invalid key." };
  try {
    await deleteGoogleApiKey(id);
    return await done();
  } catch (e) {
    return failure("delete", e);
  }
}

// Asks Google whether the key works, without spending generation quota.
export async function testKey(key: unknown): Promise<ActionResult<string>> {
  const denied = await guard();
  if (denied) return denied;
  if (typeof key !== "string" || !key.trim() || key.length > LIMITS.key) return { ok: false, error: "No key to test." };
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1", {
      headers: { "x-goog-api-key": key.trim() },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (res.ok) return { ok: true, data: "Key works." };
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    return { ok: false, error: `Google rejected the key: ${body?.error?.message ?? `HTTP ${res.status}`}` };
  } catch (e) {
    console.error("Failed to test Google API key", e);
    return { ok: false, error: "Couldn't reach Google to test the key." };
  }
}
