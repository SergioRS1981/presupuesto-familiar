import { Router } from "express";
import { asyncHandler, validateBody, validateQuery } from "../../lib/http";
import { z } from "zod";
import { reportQuerySchema, yearActivationPayloadSchema, yearPayloadSchema } from "./report.schemas";
import { createAvailableYear, getAnnualReport, getAvailableYears, updateAvailableYearStatus } from "./report.service";

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

reportRouter.put(
  "/years/:year",
  validateBody(yearActivationPayloadSchema),
  asyncHandler(async (req, res) => {
    const configuredYear = await updateAvailableYearStatus(z.coerce.number().int().parse(req.params.year), req.body.active);
    res.json(configuredYear);
  })
);
