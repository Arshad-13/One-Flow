import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { normalizeRole, ROLE_ROUTE_PREFIX } from "@/lib/roles";
import { getTokenFromRequest } from "@/lib/requestAuth";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // ─── Skip internal Next.js assets and static files ───────────────────────
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ─── Skip public auth API routes ──────────────────────────────────────────
  // These don't need a token (login, register, OTP, etc.)
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // ─── Detect Next.js RSC navigation requests ───────────────────────────────
  // RSC requests carry this header — we still auth-check them, but we must
  // NOT send a 307 redirect (that causes a full navigation to /login in the
  // RSC router). Instead we return a 401 JSON so the client can handle it.
  const isRscNavigation =
    req.headers.get("RSC") === "1" ||
    req.nextUrl.searchParams.has("_rsc") ||
    req.headers.get("Next-Router-State-Tree") !== null;

  const token = getTokenFromRequest(req);

  if (!token) {
    if (isRscNavigation) {
      // Tell the RSC client the session is gone — it will re-render login
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  let payload;
  try {
    const result = await jwtVerify(token, secret);
    payload = result.payload;
  } catch {
    // Invalid / expired JWT — clear cookies
    if (isRscNavigation) {
      const res = new NextResponse(
        JSON.stringify({ error: "Session expired" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
      res.cookies.set("token", "", { httpOnly: true, maxAge: 0, path: "/" });
      res.cookies.set("__Secure-token", "", { httpOnly: true, maxAge: 0, path: "/" });
      return res;
    }
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set("token", "", { httpOnly: true, maxAge: 0, path: "/" });
    res.cookies.set("__Secure-token", "", { httpOnly: true, maxAge: 0, path: "/" });
    return res;
  }

  const userRole = normalizeRole(payload.role);

  if (!userRole || !ROLE_ROUTE_PREFIX[userRole]) {
    if (isRscNavigation) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid role" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const userPrefix = ROLE_ROUTE_PREFIX[userRole]; // e.g. "/admin"

  // ─── Legacy /dashboard/* routes ───────────────────────────────────────────
  // Redirect to role-specific dashboard (only for real page navigations,
  // not RSC prefetches — RSC prefetches for /dashboard/* are silently dropped)
  if (pathname.startsWith("/dashboard")) {
    if (isRscNavigation) {
      // Don't redirect RSC prefetches — they'll never be displayed anyway
      return NextResponse.next();
    }
    const remainder = pathname.slice("/dashboard".length);
    const roleDashboard = `${userPrefix}/dashboard${remainder}`;
    return NextResponse.redirect(new URL(roleDashboard, req.url));
  }

  // ─── Role-prefix RBAC check ───────────────────────────────────────────────
  for (const [role, prefix] of Object.entries(ROLE_ROUTE_PREFIX)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      if (userRole !== role) {
        // Wrong role for this section
        if (isRscNavigation) {
          return new NextResponse(
            JSON.stringify({ error: "Forbidden" }),
            { status: 403, headers: { "content-type": "application/json" } }
          );
        }
        return NextResponse.redirect(
          new URL(`${userPrefix}/dashboard`, req.url)
        );
      }
      // Correct role — pass through
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Legacy dashboard routes
    "/dashboard/:path*",
    // Role-based routes — use :path* only (covers root AND sub-paths)
    "/admin/:path*",
    "/project_manager/:path*",
    "/team_member/:path*",
    "/sales_finance/:path*",
  ],
};
