import { z } from "zod";

export const budgetQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100)
});

export const budgetPayloadSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  categoryId: z.string().min(1),
  plannedAmount: z.coerce.number().min(0)
});
