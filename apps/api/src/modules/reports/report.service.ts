import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http";
import { ensureYearBudgetMatrix } from "../budgets/budget-provision.service";
import { calculateReport } from "./report-calculator";

type AvailableYear = {
  year: number;
  active: boolean;
};

export const getAnnualReport = async (year: number) => {
  await ensureYearBudgetMatrix(year);

  const [budgets, consumptions] = await Promise.all([
    prisma.annualBudget.findMany({
      where: { year },
      include: { category: true }
    }),
    prisma.monthlyConsumption.findMany({
      where: { year },
      include: { category: true }
    })
  ]);

  return calculateReport(year, budgets, consumptions);
};

export const ensureYearExists = async (year: number) => {
  await prisma.configuredYear.upsert({
    where: { year },
    update: {},
    create: { year, active: true }
  });

  await ensureYearBudgetMatrix(year);
};

export const createAvailableYear = async (year: number) => {
  const configuredYear = await prisma.configuredYear.upsert({
    where: { year },
    update: { active: true },
    create: { year, active: true }
  });

  await ensureYearBudgetMatrix(year);

  return configuredYear;
};

export const getAvailableYears = async () => {
  const [configuredYears, budgetYears, consumptionYears] = await Promise.all([
    prisma.configuredYear.findMany({
      select: { year: true, active: true },
      orderBy: { year: "asc" }
    }),
    prisma.annualBudget.findMany({
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "asc" }
    }),
    prisma.monthlyConsumption.findMany({
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "asc" }
    })
  ]);

  const configuredYearMap = new Map(configuredYears.map((item) => [item.year, item.active]));
  const years = Array.from(new Set([...configuredYears, ...budgetYears, ...consumptionYears].map((item) => item.year)))
    .sort((left, right) => left - right)
    .map((year) => ({
      year,
      active: configuredYearMap.get(year) ?? true
    }));

  return years;
};

export const updateAvailableYearStatus = async (year: number, active: boolean) => {
  const availableYears = await getAvailableYears();
  const targetYear = availableYears.find((item) => item.year === year);

  if (!targetYear) {
    throw new HttpError(404, "El ano indicado no existe.");
  }

  const activeYears = availableYears.filter((item) => item.active);

  if (!active && activeYears.length === 1 && activeYears[0]?.year === year) {
    throw new HttpError(400, "Debe quedar al menos un ano activo para poder navegar por la aplicacion.");
  }

  const updatedYear = await prisma.configuredYear.upsert({
    where: { year },
    update: { active },
    create: { year, active }
  });

  await ensureYearBudgetMatrix(updatedYear.year);

  return updatedYear satisfies AvailableYear;
};
