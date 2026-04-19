import { Router } from "express";
import { z } from "zod";
import { asyncHandler, validateBody } from "../../lib/http";
import { categoryPayloadSchema } from "./category.schemas";
import { createCategory, deleteCategory, listCategories, updateCategory } from "./category.service";

export const categoryRouter = Router();

categoryRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await listCategories();
    res.json(categories);
  })
);

categoryRouter.post(
  "/",
  validateBody(categoryPayloadSchema),
  asyncHandler(async (req, res) => {
    const category = await createCategory(req.body);
    res.status(201).json(category);
  })
);

categoryRouter.put(
  "/:id",
  validateBody(categoryPayloadSchema),
  asyncHandler(async (req, res) => {
    const category = await updateCategory(z.string().parse(req.params.id), req.body);
    res.json(category);
  })
);

categoryRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteCategory(z.string().parse(req.params.id));
    res.status(204).send();
  })
);
