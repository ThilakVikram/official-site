import { prisma } from "./prisma";
import type { PersonalData } from "../generated/prisma/client";
import type { EntryInput, PersonalDataEntry } from "@/app/admin/personal_data/types";
import { deleteVdbEntries, newVdbId, upsertVdbEntries } from "@/app/_ai/personal_model/store_data_to_vdb";

// Every write goes to the vector DB first and then to MySQL. If the second
// write fails, the vector DB change is undone so the two stores stay in sync.

function toEntry(r: PersonalData): PersonalDataEntry {
  return {
    id: r.id,
    category: r.category,
    title: r.title ?? "",
    content: r.content,
    syncedAt: r.syncedAt?.toISOString() ?? null,
    updatedAt: r.updatedAt.toISOString(),
  };
}

const toVdb = (id: string, e: EntryInput) => ({ id, category: e.category, title: e.title, content: e.content });

async function undo(what: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (e) {
    console.error(`Could not undo vector DB change (${what}); stores may be out of sync`, e);
  }
}

export async function listPersonalData(): Promise<PersonalDataEntry[]> {
  const rows = await prisma.personalData.findMany({ orderBy: [{ category: "asc" }, { updatedAt: "desc" }] });
  return rows.map(toEntry);
}

export async function createPersonalData(inputs: EntryInput[]): Promise<PersonalDataEntry[]> {
  const items = inputs.map((input) => ({ id: newVdbId(), input }));
  await upsertVdbEntries(items.map(({ id, input }) => toVdb(id, input)));

  // Same timestamp for both, so the row counts as synced.
  const now = new Date();
  try {
    const rows = await prisma.$transaction(
      items.map(({ id, input }) =>
        prisma.personalData.create({
          data: { id, category: input.category, title: input.title || null, content: input.content, syncedAt: now, updatedAt: now },
        }),
      ),
    );
    return rows.map(toEntry);
  } catch (e) {
    await undo("create", () => deleteVdbEntries(items.map((i) => i.id)));
    throw e;
  }
}

export async function updatePersonalData(id: string, input: EntryInput): Promise<PersonalDataEntry | null> {
  const before = await prisma.personalData.findUnique({ where: { id } });
  if (!before) return null;

  await upsertVdbEntries([toVdb(id, input)]);

  const now = new Date();
  try {
    const row = await prisma.personalData.update({
      where: { id },
      data: { category: input.category, title: input.title || null, content: input.content, syncedAt: now, updatedAt: now },
    });
    return toEntry(row);
  } catch (e) {
    await undo("update", () =>
      upsertVdbEntries([toVdb(id, { category: before.category, title: before.title ?? "", content: before.content })]),
    );
    throw e;
  }
}

export async function deletePersonalData(id: string): Promise<boolean> {
  const before = await prisma.personalData.findUnique({ where: { id } });
  if (!before) {
    // Not in MySQL; still make sure no orphan is left in the vector DB.
    await deleteVdbEntries([id]);
    return false;
  }

  // Vector DB first: a leftover vector would let the assistant keep answering
  // with data you deleted.
  await deleteVdbEntries([id]);
  try {
    await prisma.personalData.delete({ where: { id } });
    return true;
  } catch (e) {
    await undo("delete", () =>
      upsertVdbEntries([toVdb(id, { category: before.category, title: before.title ?? "", content: before.content })]),
    );
    throw e;
  }
}
