import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { parse as parseCookie } from "cookie";
import type { Request } from "express";
import { ENV } from "./_core/env";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getUserById, getUserByEmail, upsertUser } from "./db";
import type { User } from "../drizzle/schema";

type SessionPayload = {
  userId: number;
  email: string;
  name: string;
};

function getSecret() {
  const secret = ENV.cookieSecret;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload, options?: { expiresInMs?: number }): Promise<string> {
  const expiresInMs = options?.expiresInMs ?? ONE_YEAR_MS;
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + expiresInMs))
    .sign(getSecret());
}

export async function verifySession(cookieValue: string | undefined | null): Promise<SessionPayload | null> {
  if (!cookieValue) return null;
  try {
    const { payload } = await jwtVerify(cookieValue, getSecret());
    const { userId, email, name } = payload as unknown as SessionPayload;
    if (!userId || !email) return null;
    return { userId, email, name };
  } catch {
    return null;
  }
}

export async function createSessionToken(user: { id: number; email: string; name: string | null }): Promise<string> {
  return signSession({ userId: user.id, email: user.email, name: user.name || "" });
}

export async function authenticateRequest(req: Request): Promise<User | null> {
  try {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    const cookies = parseCookie(cookieHeader);
    const token = cookies[COOKIE_NAME];
    const session = await verifySession(token);
    if (!session) return null;
    return getUserById(session.userId);
  } catch {
    return null;
  }
}

export async function registerUser(input: { name: string; email: string; password: string }): Promise<User> {
  // Check if email already exists
  const existing = await getUserByEmail(input.email);
  if (existing) {
    throw new Error("Un compte avec cet email existe déjà");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await upsertUser({
    email: input.email,
    name: input.name,
    googleId: null,
    passwordHash,
    loginMethod: "email",
  });
  return user;
}

export async function loginUser(input: { email: string; password: string }): Promise<User> {
  const user = await getUserByEmail(input.email);
  if (!user || !user.passwordHash) {
    throw new Error("Email ou mot de passe incorrect");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new Error("Email ou mot de passe incorrect");
  }

  return user;
}

export async function handleGoogleCallback(code: string, redirectUri: string): Promise<User> {
  const client = new OAuth2Client(ENV.googleClientId, ENV.googleClientSecret, redirectUri);
  const { tokens } = await client.getToken(code);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: ENV.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error("Impossible de récupérer les informations Google");
  }

  const user = await upsertUser({
    email: payload.email,
    name: payload.name || payload.email.split("@")[0],
    googleId: payload.sub,
    passwordHash: null,
    loginMethod: "google",
  });

  return user;
}
