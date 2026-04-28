import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http";
import { z } from "zod";
import { ensureCategoryBudgetMatrix } from "../budgets/budget-provision.service";
import { categoryPayloadSchema } from "./category.schemas";

type CategoryPayload = z.infer<typeof categoryPayloadSchema>;

export const listCategories = async () => {
  return prisma.budgetCategory.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }]
  });
};

export const createCategory = async (payload: CategoryPayload) => {
  const category = await prisma.budgetCategory.create({
    data: payload
  });

  await ensureCategoryBudgetMatrix(category.id);

  return category;
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
