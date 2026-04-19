import { Router } from "express";
import { z } from "zod";
import { asyncHandler, validateBody, validateQuery } from "../../lib/http";
import { budgetPayloadSchema, budgetQuerySchema } from "./budget.schemas";
import { deleteBudget, listBudgetsByYear, upsertBudget } from "./budget.service";

export const budgetRouter = Router();

budgetRouter.get(
  "/",
  validateQuery(budgetQuerySchema),
  asyncHandler(async (req, res) => {
    const budgets = await listBudgetsByYear(Number(req.query.year));
    res.json(budgets);
  })
);

budgetRouter.post(
  "/",
  validateBody(budgetPayloadSchema),
  asyncHandler(async (req, res) => {
    const budget = await upsertBudget(req.body);
    res.status(201).json(budget);
  })
);

budgetRouter.put(
  "/:id",
  validateBody(budgetPayloadSchema),
  asyncHandler(async (req, res) => {
    const budget = await upsertBudget({
      ...req.body,
      categoryId: req.body.categoryId
    });
    res.json({
      ...budget,
      requestId: z.string().parse(req.params.id)
    });
  })
);

budgetRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteBudget(z.string().parse(req.params.id));
    res.status(204).send();
  })
);
