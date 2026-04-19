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

export const getAvailableYears = async () => {
  const [budgetYears, consumptionYears] = await Promise.all([
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

  const years = Array.from(new Set([...budgetYears, ...consumptionYears].map((item) => item.year))).sort(
    (left, right) => left - right
  );

  return years;
};
