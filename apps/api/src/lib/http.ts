import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export const validateBody =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(new HttpError(400, result.error.issues.map((issue) => issue.message).join(", ")));
    }

    req.body = result.data;
    return next();
  };

export const validateQuery =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return next(new HttpError(400, result.error.issues.map((issue) => issue.message).join(", ")));
    }

    req.query = result.data as Request["query"];
    return next();
  };

export const asyncHandler =
  <T extends Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<void>) =>
  (req: T, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };
