import { prisma } from "../../lib/prisma";
import { calculateReport } from "./report-calculator";

export const getAnnualReport = async (year: number) => {
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
    create: { year }
  });
};

export const createAvailableYear = async (year: number) => {
  return prisma.configuredYear.upsert({
    where: { year },
    update: {},
    create: { year }
  });
};

export const getAvailableYears = async () => {
  const [configuredYears, budgetYears, consumptionYears] = await Promise.all([
    prisma.configuredYear.findMany({
      select: { year: true },
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

  const years = Array.from(new Set([...configuredYears, ...budgetYears, ...consumptionYears].map((item) => item.year))).sort(
    (left, right) => left - right
  );

  return years;
};
