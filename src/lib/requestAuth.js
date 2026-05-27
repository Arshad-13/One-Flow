export function getTokenFromRequest(req) {
  const cookieToken = req.cookies.get("token")?.value;
  if (cookieToken) return cookieToken;

  const secureCookieToken = req.cookies.get("__Secure-token")?.value;
  if (secureCookieToken) return secureCookieToken;

  const hostCookieToken = req.cookies.get("__Host-token")?.value;
  if (hostCookieToken) return hostCookieToken;

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}
