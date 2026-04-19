import { BudgetKind, BudgetNature } from "@prisma/client";
import { z } from "zod";

export const categoryPayloadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional().nullable(),
  kind: z.nativeEnum(BudgetKind),
  nature: z.nativeEnum(BudgetNature),
  active: z.boolean().default(true)
});
