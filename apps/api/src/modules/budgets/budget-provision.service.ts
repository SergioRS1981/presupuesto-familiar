import { prisma } from "../../lib/prisma";

const buildUniqueYears = (years: number[]) => Array.from(new Set(years)).sort((left, right) => left - right);

export const ensureYearBudgetMatrix = async (year: number) => {
  const [categories, existingBudgets] = await Promise.all([
    prisma.budgetCategory.findMany({
      select: { id: true }
    }),
    prisma.annualBudget.findMany({
      where: { year },
      select: { categoryId: true }
    })
  ]);

  const existingCategoryIds = new Set(existingBudgets.map((budget) => budget.categoryId));
  const missingBudgets = categories
    .filter((category) => !existingCategoryIds.has(category.id))
    .map((category) => ({
      year,
      categoryId: category.id,
      plannedAmount: 0
    }));

  if (missingBudgets.length === 0) {
    return;
  }

  await prisma.annualBudget.createMany({
    data: missingBudgets,
    skipDuplicates: true
  });
};

export const ensureCategoryBudgetMatrix = async (categoryId: string) => {
  const [configuredYears, budgetYears, consumptionYears, existingBudgets] = await Promise.all([
    prisma.configuredYear.findMany({
      select: { year: true }
    }),
    prisma.annualBudget.findMany({
      select: { year: true },
      distinct: ["year"]
    }),
    prisma.monthlyConsumption.findMany({
      select: { year: true },
      distinct: ["year"]
    }),
    prisma.annualBudget.findMany({
      where: { categoryId },
      select: { year: true }
    })
  ]);

  const trackedYears = buildUniqueYears(
    [...configuredYears, ...budgetYears, ...consumptionYears].map((item) => item.year)
  );

  if (trackedYears.length === 0) {
    return;
  }

  const existingYears = new Set(existingBudgets.map((budget) => budget.year));
  const missingBudgets = trackedYears
    .filter((year) => !existingYears.has(year))
    .map((year) => ({
      year,
      categoryId,
      plannedAmount: 0
    }));

  if (missingBudgets.length === 0) {
    return;
  }

  await prisma.annualBudget.createMany({
    data: missingBudgets,
    skipDuplicates: true
  });
};
