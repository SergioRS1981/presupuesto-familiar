import { Router } from "express";
import { env } from "../../config/env";
import { createSessionToken, clearSessionCookie, getAuthenticatedUsername, verifyPassword, writeSessionCookie } from "../../lib/auth";
import { asyncHandler, HttpError, validateBody } from "../../lib/http";
import { loginPayloadSchema } from "./auth.schemas";

export const authRouter = Router();

authRouter.get(
  "/session",
  asyncHandler(async (req, res) => {
    const username = getAuthenticatedUsername(req, env.SESSION_SECRET);

    if (!username) {
      res.json({ authenticated: false });
      return;
    }

    res.json({ authenticated: true, username });
  })
);

authRouter.post(
  "/login",
  validateBody(loginPayloadSchema),
  asyncHandler(async (req, res) => {
    const isValidUsername = req.body.username === env.AUTH_USERNAME;
    const isValidPassword = verifyPassword(req.body.password, env.AUTH_PASSWORD_HASH);

    if (!isValidUsername || !isValidPassword) {
      throw new HttpError(401, "Usuario o contrasena incorrectos.");
    }

    const sessionToken = createSessionToken(env.AUTH_USERNAME, env.SESSION_SECRET, env.SESSION_TTL_HOURS);

    writeSessionCookie(res, sessionToken, env.NODE_ENV === "production", env.SESSION_TTL_HOURS);
    res.json({ authenticated: true, username: env.AUTH_USERNAME });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    clearSessionCookie(res, env.NODE_ENV === "production");
    res.status(204).send();
  })
);
