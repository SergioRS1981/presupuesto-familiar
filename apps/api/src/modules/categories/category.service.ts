import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http";
import { z } from "zod";
import { categoryPayloadSchema } from "./category.schemas";

type CategoryPayload = z.infer<typeof categoryPayloadSchema>;

export const listCategories = async () => {
  return prisma.budgetCategory.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }]
  });
};

export const createCategory = async (payload: CategoryPayload) => {
  return prisma.budgetCategory.create({
    data: payload
  });
};

export const updateCategory = async (id: string, payload: CategoryPayload) => {
  const existing = await prisma.budgetCategory.findUnique({ where: { id } });

  if (!existing) {
    throw new HttpError(404, "La partida no existe.");
  }

  return prisma.budgetCategory.update({
    where: { id },
    data: payload
  });
};

export const deleteCategory = async (id: string) => {
  const existing = await prisma.budgetCategory.findUnique({ where: { id } });

  if (!existing) {
    throw new HttpError(404, "La partida no existe.");
  }

  await prisma.budgetCategory.delete({ where: { id } });
};
