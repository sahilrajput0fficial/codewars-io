import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
    ? "https://codewars-io.vercel.app/_/backend"
    : "http://localhost:8000");

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
