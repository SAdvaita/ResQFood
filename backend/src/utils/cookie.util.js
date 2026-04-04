import { ENV } from "../config/env.js";

export const refreshCookieOptions = {
  httpOnly: true,
  secure: ENV.NODE_ENV === "production",
  sameSite: "lax",
  domain: ENV.COOKIE_DOMAIN,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000
};
