import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { HttpError } from "./lib/http";
import { budgetRouter } from "./modules/budgets/budget.routes";
import { categoryRouter } from "./modules/categories/category.routes";
import { consumptionRouter } from "./modules/consumptions/consumption.routes";
import { reportRouter } from "./modules/reports/report.routes";

export const app = express();

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"]
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(`${env.API_PREFIX}/categories`, categoryRouter);
app.use(`${env.API_PREFIX}/budgets`, budgetRouter);
app.use(`${env.API_PREFIX}/consumptions`, consumptionRouter);
app.use(`${env.API_PREFIX}/reports`, reportRouter);

app.use((_req, _res, next) => {
  next(new HttpError(404, "Recurso no encontrado."));
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({
    message: env.NODE_ENV === "production" ? "Error interno del servidor." : error.message
  });
});
