import { NextResponse } from "next/server";

export async function POST(req) {
  const isSecure = req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https:");
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecure,
    expires: new Date(0),
    maxAge: 0,
  };
  // Clear cookie then redirect home (303 so POST becomes GET on redirect)
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.set("token", "", cookieOptions);
  res.cookies.set("__Secure-token", "", cookieOptions);
  return res;
}

// Also support GET to allow link-based logout
export async function GET(req) {
  const isSecure = req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https:");
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecure,
    expires: new Date(0),
    maxAge: 0,
  };
  const res = NextResponse.redirect(new URL("/", req.url), 302);
  res.cookies.set("token", "", cookieOptions);
  res.cookies.set("__Secure-token", "", cookieOptions);
  return res;
}
