import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: it looks for the session cookie, not the database.
// Pages and actions confirm the session with getCurrentUser()/isAdmin().
const SESSION_COOKIE = "session";

// Open to everyone. The assistant API is public because the chat on "/" calls it.
const PUBLIC = new Set(["/", "/api/personal_assistant"]);
const AUTH_PAGES = new Set(["/auth/login", "/auth/signin"]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = request.cookies.has(SESSION_COOKIE);

  if (AUTH_PAGES.has(pathname)) {
    return signedIn ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (PUBLIC.has(pathname) || signedIn) return NextResponse.next();

  if (pathname.startsWith("/api/")) return Response.json({ error: "Sign in required." }, { status: 401 });
  const login = new URL("/auth/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Skip Next internals and static files in public/.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
