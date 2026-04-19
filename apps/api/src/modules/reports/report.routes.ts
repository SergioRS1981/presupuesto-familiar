import { Router } from "express";
import { asyncHandler, validateQuery } from "../../lib/http";
import { reportQuerySchema } from "./report.schemas";
import { getAnnualReport, getAvailableYears } from "./report.service";

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
