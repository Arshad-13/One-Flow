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

  const rawCookieHeader = req.headers.get("cookie") || req.headers.get("Cookie");
  if (rawCookieHeader) {
    const cookieMap = Object.fromEntries(
      rawCookieHeader
        .split(";")
        .map((segment) => segment.trim())
        .filter(Boolean)
        .map((segment) => {
          const index = segment.indexOf("=");
          if (index === -1) return [segment, ""];
          const key = segment.slice(0, index);
          const value = segment.slice(index + 1);
          return [key, decodeURIComponent(value)];
        })
    );

    const headerToken = cookieMap.token || cookieMap["__Secure-token"] || cookieMap["__Host-token"];
    if (headerToken) return headerToken;
  }

  return null;
}
