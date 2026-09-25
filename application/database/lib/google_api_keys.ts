import { prisma } from "./prisma";
import type { GoogleApiKey } from "../generated/prisma/client";
import type { ApiKeyEntry, ApiKeyInput } from "@/app/admin/settings/types";

function toEntry(r: GoogleApiKey): ApiKeyEntry {
  return { id: r.id, label: r.label, key: r.key, isActive: r.isActive, updatedAt: r.updatedAt.toISOString() };
}

export async function listGoogleApiKeys(): Promise<ApiKeyEntry[]> {
  const rows = await prisma.googleApiKey.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "asc" }] });
  return rows.map(toEntry);
}

// Read on every assistant request, so switching keys applies immediately.
export async function getActiveGoogleApiKey(): Promise<string | undefined> {
  const row = await prisma.googleApiKey.findFirst({ where: { isActive: true }, select: { key: true } });
  return row?.key ?? process.env.GEMINI_API_KEY ?? undefined;
}

// The first key added becomes active, so a fresh setup works straight away.
export async function createGoogleApiKey(input: ApiKeyInput): Promise<ApiKeyEntry> {
  return prisma.$transaction(async (tx) => {
    const hasActive = !!(await tx.googleApiKey.findFirst({ where: { isActive: true }, select: { id: true } }));
    return toEntry(await tx.googleApiKey.create({ data: { ...input, isActive: !hasActive } }));
  });
}

export async function updateGoogleApiKey(id: number, input: ApiKeyInput): Promise<ApiKeyEntry | null> {
  const { count } = await prisma.googleApiKey.updateMany({ where: { id }, data: input });
  if (!count) return null;
  return toEntry(await prisma.googleApiKey.findUniqueOrThrow({ where: { id } }));
}

// Makes `id` the only active key.
export async function activateGoogleApiKey(id: number): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    if (!(await tx.googleApiKey.findUnique({ where: { id }, select: { id: true } }))) return false;
    await tx.googleApiKey.updateMany({ where: { isActive: true, NOT: { id } }, data: { isActive: false } });
    await tx.googleApiKey.update({ where: { id }, data: { isActive: true } });
    return true;
  });
}

export async function deleteGoogleApiKey(id: number) {
  await prisma.googleApiKey.deleteMany({ where: { id } });
}
