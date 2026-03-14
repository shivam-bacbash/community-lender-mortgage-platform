import { NextResponse, type NextRequest } from "next/server";

import { getCurrentProfile } from "@/lib/auth/profile";
import { canAccessPath, getDashboardPathForRole } from "@/lib/auth/roles";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/server";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];
const ENTRY_ROUTES = ["/login", "/register"];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/borrower") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/admin")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });
  const supabase = createSupabaseMiddlewareClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isProtectedPath(pathname)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  let profile = null;

  try {
    profile = await getCurrentProfile(supabase, user);
  } catch {
    profile = null;
  }

  if (!profile) {
    if (matchesRoute(pathname, PUBLIC_ROUTES)) {
      return response;
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "profile-missing");
    return NextResponse.redirect(loginUrl);
  }

  const dashboardPath = getDashboardPathForRole(profile.role);

  if (matchesRoute(pathname, ENTRY_ROUTES)) {
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  if (!canAccessPath(profile.role, pathname)) {
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
