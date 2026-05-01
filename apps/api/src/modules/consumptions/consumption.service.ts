import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http";
import { z } from "zod";
import { consumptionPayloadSchema } from "./consumption.schemas";
import { ensureYearExists } from "../reports/report.service";

type ConsumptionPayload = z.infer<typeof consumptionPayloadSchema>;

export const listConsumptionsByYear = async (year: number) => {
  return prisma.monthlyConsumption.findMany({
    where: { year },
    include: { category: true },
    orderBy: [{ month: "asc" }, { category: { kind: "asc" } }, { category: { name: "asc" } }]
  });
};

export const upsertConsumption = async (payload: ConsumptionPayload) => {
  const category = await prisma.budgetCategory.findUnique({
    where: { id: payload.categoryId }
  });

  if (!category) {
    throw new HttpError(404, "La partida asociada no existe.");
  }

  await ensureYearExists(payload.year);

  return prisma.monthlyConsumption.upsert({
    where: {
      year_month_categoryId: {
        year: payload.year,
        month: payload.month,
        categoryId: payload.categoryId
      }
    },
    update: {
      actualAmount: payload.actualAmount,
      note: payload.note
    },
    create: payload,
    include: {
      category: true
    }
  });
};

export const deleteConsumption = async (id: string) => {
  const existing = await prisma.monthlyConsumption.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new HttpError(404, "El consumo no existe.");
  }

  await prisma.monthlyConsumption.delete({ where: { id } });
};
