import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const hasAuthToken =
    request.cookies.has("access_token") || request.cookies.has("refresh_token");

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/play") ||
    request.nextUrl.pathname.startsWith("/leaderboard") ||
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/match");

  if (isProtectedRoute && !hasAuthToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
