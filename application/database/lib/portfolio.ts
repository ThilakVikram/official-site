import { prisma } from "./prisma";
import type { Prisma } from "../generated/prisma/client";
import { defaultPortfolio, normalizePortfolio, type Portfolio } from "@/app/_portfolio/content";

const ROW_ID = 1;

// Returns the saved portfolio, or the defaults if nothing has been saved yet.
export async function getPortfolio(): Promise<Portfolio> {
  const row = await prisma.portfolio.findUnique({ where: { id: ROW_ID } });
  return row ? normalizePortfolio(row.content) : defaultPortfolio;
}

export async function savePortfolio(data: Portfolio) {
  const content = data as unknown as Prisma.InputJsonValue;
  await prisma.portfolio.upsert({
    where: { id: ROW_ID },
    create: { id: ROW_ID, content },
    update: { content },
  });
}
