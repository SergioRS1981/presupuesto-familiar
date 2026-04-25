import { Router } from "express";
import { asyncHandler, validateBody, validateQuery } from "../../lib/http";
import { reportQuerySchema, yearPayloadSchema } from "./report.schemas";
import { createAvailableYear, getAnnualReport, getAvailableYears } from "./report.service";

export const reportRouter = Router();

reportRouter.get(
  "/annual",
  validateQuery(reportQuerySchema),
  asyncHandler(async (req, res) => {
    const report = await getAnnualReport(Number(req.query.year));
    res.json(report);
  })
);

reportRouter.get(
  "/years",
  asyncHandler(async (_req, res) => {
    const years = await getAvailableYears();
    res.json(years);
  })
);

reportRouter.post(
  "/years",
  validateBody(yearPayloadSchema),
  asyncHandler(async (req, res) => {
    const configuredYear = await createAvailableYear(req.body.year);
    res.status(201).json(configuredYear);
  })
);
