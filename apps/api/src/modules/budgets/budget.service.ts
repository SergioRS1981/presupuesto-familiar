import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http";
import { z } from "zod";
import { ensureYearBudgetMatrix } from "./budget-provision.service";
import { budgetPayloadSchema } from "./budget.schemas";
import { ensureYearExists } from "../reports/report.service";

type BudgetPayload = z.infer<typeof budgetPayloadSchema>;

export const listBudgetsByYear = async (year: number) => {
  await ensureYearBudgetMatrix(year);

  return prisma.annualBudget.findMany({
    where: { year },
    include: { category: true },
    orderBy: [{ category: { kind: "asc" } }, { category: { nature: "asc" } }, { category: { name: "asc" } }]
  });
};

export const upsertBudget = async (payload: BudgetPayload) => {
  const category = await prisma.budgetCategory.findUnique({
    where: { id: payload.categoryId }
  });

  if (!category) {
    throw new HttpError(404, "La partida asociada no existe.");
  }

  await ensureYearExists(payload.year);

  return prisma.annualBudget.upsert({
    where: {
      year_categoryId: {
        year: payload.year,
        categoryId: payload.categoryId
      }
    },
    update: {
      plannedAmount: payload.plannedAmount
    },
    create: payload,
    include: {
      category: true
    }
  });
};

export const deleteBudget = async (id: string) => {
  const existing = await prisma.annualBudget.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new HttpError(404, "El presupuesto no existe.");
  }

  await prisma.annualBudget.delete({ where: { id } });
};
