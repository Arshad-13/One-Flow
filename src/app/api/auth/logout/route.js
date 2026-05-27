import { NextResponse } from "next/server";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
  expires: new Date(0),
  maxAge: 0,
};

export async function POST(req) {
  // Clear cookie then redirect home (303 so POST becomes GET on redirect)
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.set("token", "", cookieOptions);
  res.cookies.set("__Secure-token", "", cookieOptions);
  return res;
}

// Also support GET to allow link-based logout
export async function GET(req) {
  const res = NextResponse.redirect(new URL("/", req.url), 302);
  res.cookies.set("token", "", cookieOptions);
  res.cookies.set("__Secure-token", "", cookieOptions);
  return res;
}
