import type { CookieOptions, Response } from "express";

export const ACCESS_COOKIE = "byhltv_access";
export const REFRESH_COOKIE = "byhltv_refresh";

function baseOptions(): CookieOptions {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  };
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  ttl: { accessMs: number; refreshMs: number },
) {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...baseOptions(),
    maxAge: ttl.accessMs,
  });
  // Refresh only needed on auth endpoints, but Path=/ keeps logout/WS simple on localhost
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOptions(),
    maxAge: ttl.refreshMs,
    path: "/",
  });
}

export function clearAuthCookies(res: Response) {
  const opts = baseOptions();
  res.clearCookie(ACCESS_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
}
