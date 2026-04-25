import { z } from "zod";

const currentYear = new Date().getFullYear();

export const reportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100)
});

export const yearPayloadSchema = z.object({
  year: z.coerce.number().int().min(2000).max(currentYear)
});
