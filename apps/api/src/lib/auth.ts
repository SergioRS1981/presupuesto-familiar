import crypto from "crypto";
import { Request, Response } from "express";

export const SESSION_COOKIE_NAME = "presupuesto_session";

type SessionPayload = {
  exp: number;
  sub: string;
};

const sign = (value: string, secret: string) =>
  crypto.createHmac("sha256", secret).update(value).digest("base64url");

const parseStoredHash = (storedHash: string) => {
  const [algorithm, salt, hash] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !hash) {
    throw new Error("AUTH_PASSWORD_HASH no tiene un formato valido.");
  }

  return { salt, hash };
};

export const createPasswordHash = (password: string) => {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.scryptSync(password, salt, 64).toString("base64url");

  return `scrypt:${salt}:${hash}`;
};

export const verifyPassword = (password: string, storedHash: string) => {
  const { salt, hash } = parseStoredHash(storedHash);
  const expectedHash = Buffer.from(hash, "base64url");
  const actualHash = crypto.scryptSync(password, salt, expectedHash.length);

  return crypto.timingSafeEqual(expectedHash, actualHash);
};

export const createSessionToken = (username: string, secret: string, ttlHours: number) => {
  const payload: SessionPayload = {
    sub: username,
    exp: Math.floor(Date.now() / 1000) + ttlHours * 60 * 60
  };
  const serializedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(serializedPayload, secret);

  return `${serializedPayload}.${signature}`;
};

export const readSessionToken = (token: string | undefined, secret: string) => {
  if (!token) {
    return null;
  }

  const [serializedPayload, receivedSignature] = token.split(".");

  if (!serializedPayload || !receivedSignature) {
    return null;
  }

  const expectedSignature = sign(serializedPayload, secret);

  if (
    expectedSignature.length !== receivedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(receivedSignature))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(serializedPayload, "base64url").toString("utf8")) as SessionPayload;

    if (!payload.sub || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

export const parseCookies = (cookieHeader: string | undefined) =>
  Object.fromEntries(
    (cookieHeader ?? "")
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [key, ...value] = entry.split("=");
        return [key, decodeURIComponent(value.join("="))];
      })
  );

export const getAuthenticatedUsername = (req: Request, secret: string) => {
  const cookies = parseCookies(req.headers.cookie);
  const payload = readSessionToken(cookies[SESSION_COOKIE_NAME], secret);

  return payload?.sub ?? null;
};

export const writeSessionCookie = (
  res: Response,
  token: string,
  secure: boolean,
  ttlHours: number
) => {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: ttlHours * 60 * 60 * 1000
  });
};

export const clearSessionCookie = (res: Response, secure: boolean) => {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/"
  });
};
