import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/session";

const PROTECTED_PREFIXES = ["/dashboard", "/my-cards", "/account", "/editor", "/cards", "/upgrade"];
const AUTH_PAGES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  if (isProtectedPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return buildRedirectResponse(loginUrl, response);
  }

  if (AUTH_PAGES.includes(pathname) && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return buildRedirectResponse(dashboardUrl, response);
  }

  return response;
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const config = {
  matcher: ["/login", "/signup", "/dashboard/:path*", "/my-cards/:path*", "/account/:path*", "/editor/:path*", "/cards/:path*", "/upgrade/:path*"],
};

function buildRedirectResponse(url: URL, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}
