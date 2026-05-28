import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { normalizeRole, ROLE_ROUTE_PREFIX } from "@/lib/roles";
import { getTokenFromRequest } from "@/lib/requestAuth";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow public auth API routes through without token check
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  let payload;
  try {
    const result = await jwtVerify(token, secret);
    payload = result.payload;
  } catch {
    // Invalid or expired token — clear cookie and redirect to login
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set("token", "", { httpOnly: true, maxAge: 0, path: "/" });
    res.cookies.set("__Secure-token", "", { httpOnly: true, maxAge: 0, path: "/" });
    return res;
  }

  const userRole = normalizeRole(payload.role);

  if (!userRole || !ROLE_ROUTE_PREFIX[userRole]) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const userPrefix = ROLE_ROUTE_PREFIX[userRole]; // e.g. "/admin"

  // Handle legacy /dashboard/* routes — redirect to role-specific dashboard
  if (pathname.startsWith("/dashboard")) {
    const remainder = pathname.slice("/dashboard".length); // e.g. "/projects/123" or ""
    const roleDashboard = `${userPrefix}/dashboard${remainder}`;
    return NextResponse.redirect(new URL(roleDashboard, req.url));
  }

  // Check if user is accessing another role's prefix
  for (const [role, prefix] of Object.entries(ROLE_ROUTE_PREFIX)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      // This route belongs to `role`; check if current user has that role
      if (userRole !== role) {
        // Redirect to user's own dashboard
        return NextResponse.redirect(
          new URL(`${userPrefix}/dashboard`, req.url)
        );
      }
      // Role matches — allow through
      return NextResponse.next();
    }
  }

  // No role-prefix matched (shouldn't happen given matcher config) — allow through
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
    "/project_manager",
    "/project_manager/:path*",
    "/team_member",
    "/team_member/:path*",
    "/sales_finance",
    "/sales_finance/:path*",
  ],
};
