import { streamPersonalModel, type ChatTurn } from "@/app/_ai/personal_model/model";
import { getPortfolio } from "@/database/lib/portfolio";

// POST { question, history? } -> streamed plain-text answer from the personal RAG model.

// Public endpoint that spends Gemini quota, so limit each IP.
// In-memory: resets on restart and isn't shared between server instances.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10_000) {
    for (const [key, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
  }
  return recent.length > MAX_PER_WINDOW;
}

function parseHistory(v: unknown): ChatTurn[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((t) =>
    t && typeof t === "object" && (t.role === "user" || t.role === "assistant") && typeof t.content === "string"
      ? [{ role: t.role, content: t.content }]
      : [],
  );
}

const error = (message: string, status: number) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (rateLimited(ip)) return error("You're asking a bit fast — try again in a minute.", 429);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return error("Invalid request.", 400);
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return error("Please type a question.", 400);
  if (question.length > 1000) return error("Please keep your question under 1000 characters.", 400);

  const ownerName = await getPortfolio()
    .then((p) => p.profile.name)
    .catch(() => undefined);

  let stream: AsyncIterable<string>;
  try {
    ({ stream } = await streamPersonalModel(question, { history: parseHistory(body.history), ownerName, clientId: ip }));
  } catch (e) {
    console.error("Personal assistant failed", e);
    return error("The assistant is unavailable right now. Please try again later.", 503);
  }

  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) controller.enqueue(encoder.encode(chunk));
        } catch (e) {
          console.error("Personal assistant stream failed", e);
          controller.enqueue(encoder.encode("\n\nSorry — something went wrong while answering."));
        }
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } },
  );
}
