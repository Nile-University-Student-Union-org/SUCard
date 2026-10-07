import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";

const handler = toNextJsHandler(auth);
export async function GET(request: Request) {
  const response = await handler.GET(request);
  if (new URL(request.url).pathname === "/api/auth/callback/microsoft" && response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (location && new URL(location, request.url).searchParams.get("error") === "account_not_linked")
      return NextResponse.redirect(new URL("/login?error=not_allowed", request.url));
  }
  if (new URL(request.url).pathname === "/api/auth/callback/microsoft" && response.status === 403) {
    const error = await response.clone().json().catch(() => null);
    const code = error?.code === "not_student" ? "not_student" : "not_allowed";
    return NextResponse.redirect(new URL(`/login?error=${code}`, request.url));
  }
  return response;
}
export const POST = handler.POST;
