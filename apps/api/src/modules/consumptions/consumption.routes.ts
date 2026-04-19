import { Router } from "express";
import { z } from "zod";
import { asyncHandler, validateBody, validateQuery } from "../../lib/http";
import { consumptionPayloadSchema, consumptionQuerySchema } from "./consumption.schemas";
import { deleteConsumption, listConsumptionsByYear, upsertConsumption } from "./consumption.service";

export const consumptionRouter = Router();

consumptionRouter.get(
  "/",
  validateQuery(consumptionQuerySchema),
  asyncHandler(async (req, res) => {
    const consumptions = await listConsumptionsByYear(Number(req.query.year));
    res.json(consumptions);
  })
);

consumptionRouter.post(
  "/",
  validateBody(consumptionPayloadSchema),
  asyncHandler(async (req, res) => {
    const consumption = await upsertConsumption(req.body);
    res.status(201).json(consumption);
  })
);

consumptionRouter.put(
  "/:id",
  validateBody(consumptionPayloadSchema),
  asyncHandler(async (req, res) => {
    const consumption = await upsertConsumption(req.body);
    res.json({
      ...consumption,
      requestId: z.string().parse(req.params.id)
    });
  })
);

consumptionRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteConsumption(z.string().parse(req.params.id));
    res.status(204).send();
  })
);
