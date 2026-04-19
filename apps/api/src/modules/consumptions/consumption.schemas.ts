import { z } from "zod";

export const consumptionQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100)
});

export const consumptionPayloadSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  categoryId: z.string().min(1),
  actualAmount: z.coerce.number().min(0)
});
