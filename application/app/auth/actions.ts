"use server";

import { hash, verify } from "argon2";
import { redirect } from "next/navigation";
import { prisma } from "@/database/lib/prisma";
import { Prisma } from "@/database/generated/prisma/client";
import { createSession, deleteSession } from "@/app/_auth/session";
import { MAX_PASSWORD, checkEmail, checkPassword, checkUserName, normalizeEmail } from "@/app/_auth/validation";

export type AuthState = { error: string } | null;

// Verified against when no user matches, so unknown and known accounts take
// the same time to reject.
const DUMMY_HASH = hash("dummy-password-for-timing");

// Only same-site paths, so ?next= can't send people to another site.
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  const userName = String(formData.get("user_name") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("c_password") ?? "");

  const invalid = checkUserName(userName) ?? checkEmail(email) ?? checkPassword(password);
  if (invalid) return { error: invalid };
  if (password !== confirm) return { error: "Passwords don't match." };

  let userId: number;
  try {
    const user = await prisma.user.create({
      data: { userName, email, passwordHash: await hash(password) },
      select: { id: true },
    });
    userId = user.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "That user name or email is already registered." };
    }
    console.error("Failed to create user", e);
    return { error: "Could not create your account. Please try again." };
  }
  await createSession(userId);
  redirect(safeNext(formData.get("next")));
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!identifier || !password || password.length > MAX_PASSWORD) return { error: "Wrong user name/email or password." };

  const user = await prisma.user.findFirst({
    where: identifier.includes("@") ? { email: identifier.toLowerCase() } : { userName: identifier },
    select: { id: true, passwordHash: true },
  });
  // verify() throws on a malformed hash (e.g. '' on legacy rows), which counts as a mismatch.
  const ok = await verify(user?.passwordHash || (await DUMMY_HASH), password).catch(() => false);
  if (!user || !ok) return { error: "Wrong user name/email or password." };

  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await deleteSession();
  redirect("/auth/login");
}
