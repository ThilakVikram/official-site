import { randomUUID } from "node:crypto";
import { ChromaClient, type Collection } from "chromadb";
import { DefaultEmbeddingFunction } from "@chroma-core/default-embed";

// Chroma server started with `npm run vdb:serve`.
const client = new ChromaClient({
  host: process.env.CHROMA_HOST ?? "localhost",
  port: Number(process.env.CHROMA_PORT) || 8001,
});

export const COLLECTION_NAME = "personal_data";

// The same embedding function must be used for storing and for querying, so
// the RAG model should get the collection from here too.
let collection: Promise<Collection> | undefined;
export function getPersonalDataCollection() {
  collection ??= client
    .getOrCreateCollection({ name: COLLECTION_NAME, embeddingFunction: new DefaultEmbeddingFunction() })
    .catch((e) => {
      collection = undefined; // retry on the next call
      throw e;
    });
  return collection;
}

export type VdbEntry = { id: string; category: string; title: string; content: string };

// Chroma doesn't generate ids; the caller picks them. This id becomes the
// Prisma primary key as well.
export const newVdbId = () => randomUUID();

// Text that gets embedded. Category and title are included so a question like
// "where did you study?" can match an education entry even if the content
// never says "study".
function toDocument(e: VdbEntry) {
  return [`${e.category}${e.title ? `: ${e.title}` : ""}`, e.content].join("\n");
}

export async function upsertVdbEntries(entries: VdbEntry[]) {
  if (!entries.length) return;
  const col = await getPersonalDataCollection();
  await col.upsert({
    ids: entries.map((e) => e.id),
    documents: entries.map(toDocument),
    metadatas: entries.map((e) => ({ category: e.category, title: e.title })),
  });
}

export async function deleteVdbEntries(ids: string[]) {
  if (!ids.length) return;
  const col = await getPersonalDataCollection();
  await col.delete({ ids });
}
