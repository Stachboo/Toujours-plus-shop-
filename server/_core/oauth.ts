import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express } from "express";
import { getSessionCookieOptions } from "./cookies";
import { handleGoogleCallback, createSessionToken } from "../auth";
import { ENV } from "./env";

export function registerAuthRoutes(app: Express) {
  // Google OAuth callback
  app.get("/api/auth/google/callback", async (req, res) => {
    const code = req.query.code as string | undefined;
    if (!code) {
      return res.redirect(302, `${ENV.frontendUrl}/login?error=missing_code`);
    }

    try {
      const redirectUri = `${ENV.backendUrl}/api/auth/google/callback`;
      const user = await handleGoogleCallback(code, redirectUri);
      const sessionToken = await createSessionToken(user);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, ENV.frontendUrl);
    } catch (error) {
      console.error("[Google OAuth] Callback failed:", error);
      res.redirect(302, `${ENV.frontendUrl}/login?error=oauth_failed`);
    }
  });
}
