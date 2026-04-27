import { NextFunction, Request, Response } from "express";
import { env } from "../../config/env";
import { getAuthenticatedUsername } from "../../lib/auth";
import { HttpError } from "../../lib/http";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const username = getAuthenticatedUsername(req, env.SESSION_SECRET);

  if (!username) {
    return next(new HttpError(401, "Debes iniciar sesion para continuar."));
  }

  return next();
};
