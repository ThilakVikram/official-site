import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/database/lib/prisma";

// Database-backed sessions. The cookie holds a random token and the sessions
// table holds its SHA-256, so deleting a row signs that browser out.
// proxy.ts only checks that this cookie exists; the real check is here.
export const SESSION_COOKIE = "session";
const MAX_AGE_S = 60 * 60 * 24 * 30;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type CurrentUser = { id: number; email: string; userName: string; name: string | null; isAdmin: boolean };

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: { id: hashToken(token), userId, expiresAt: new Date(Date.now() + MAX_AGE_S * 1000) },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_S,
    path: "/",
  });
}

export async function deleteSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}

// Cached per request, so layouts, pages and actions can all call it.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { select: { id: true, email: true, userName: true, name: true, isAdmin: true } } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
});

export async function isAdmin() {
  return !!(await getCurrentUser())?.isAdmin;
}

// For pages: sends signed-out visitors to the login page.
export async function requireUser(next = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  return user;
}
