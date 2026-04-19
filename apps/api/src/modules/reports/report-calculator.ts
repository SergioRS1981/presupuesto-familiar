import { BudgetKind, BudgetNature } from "@prisma/client";

type Category = {
  id: string;
  name: string;
  kind: BudgetKind;
  nature: BudgetNature;
};

type AmountValue = number | string | { toString(): string };

type Budget = {
  id: string;
  year: number;
  categoryId: string;
  plannedAmount: AmountValue;
  category: Category;
};

type Consumption = {
  id: string;
  year: number;
  month: number;
  categoryId: string;
  actualAmount: AmountValue;
  category: Category;
};

const toAmount = (value: AmountValue) => Number(value.toString());

const round = (value: number) => Number(value.toFixed(2));

export const calculateReport = (year: number, budgets: Budget[], consumptions: Consumption[]) => {
  const monthly = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    plannedAmount: 0,
    actualAmount: 0,
    difference: 0,
    cumulativePlanned: 0,
    cumulativeActual: 0,
    cumulativeDifference: 0
  }));

  const byItemMap = new Map<
    string,
    {
      categoryId: string;
      categoryName: string;
      kind: BudgetKind;
      nature: BudgetNature;
      plannedAmount: number;
      actualAmount: number;
      difference: number;
      consumedPercentage: number;
    }
  >();

  const byNatureMap = new Map<
    BudgetNature,
    { nature: BudgetNature; plannedAmount: number; actualAmount: number; difference: number }
  >();

  const byKindMap = new Map<
    BudgetKind,
    { kind: BudgetKind; plannedAmount: number; actualAmount: number; difference: number }
  >();

  budgets.forEach((budget) => {
    const plannedAmount = toAmount(budget.plannedAmount);
    const monthlyLinear = plannedAmount / 12;

    byItemMap.set(budget.categoryId, {
      categoryId: budget.categoryId,
      categoryName: budget.category.name,
      kind: budget.category.kind,
      nature: budget.category.nature,
      plannedAmount,
      actualAmount: 0,
      difference: plannedAmount,
      consumedPercentage: 0
    });

    const currentNature = byNatureMap.get(budget.category.nature) ?? {
      nature: budget.category.nature,
      plannedAmount: 0,
      actualAmount: 0,
      difference: 0
    };

    currentNature.plannedAmount += plannedAmount;
    currentNature.difference = currentNature.plannedAmount - currentNature.actualAmount;
    byNatureMap.set(budget.category.nature, currentNature);

    const currentKind = byKindMap.get(budget.category.kind) ?? {
      kind: budget.category.kind,
      plannedAmount: 0,
      actualAmount: 0,
      difference: 0
    };

    currentKind.plannedAmount += plannedAmount;
    currentKind.difference = currentKind.plannedAmount - currentKind.actualAmount;
    byKindMap.set(budget.category.kind, currentKind);

    monthly.forEach((monthRow) => {
      monthRow.plannedAmount += monthlyLinear;
    });
  });

  consumptions.forEach((consumption) => {
    const actualAmount = toAmount(consumption.actualAmount);
    const monthRow = monthly[consumption.month - 1];

    monthRow.actualAmount += actualAmount;

    const currentItem = byItemMap.get(consumption.categoryId) ?? {
      categoryId: consumption.categoryId,
      categoryName: consumption.category.name,
      kind: consumption.category.kind,
      nature: consumption.category.nature,
      plannedAmount: 0,
      actualAmount: 0,
      difference: 0,
      consumedPercentage: 0
    };

    currentItem.actualAmount += actualAmount;
    currentItem.difference = currentItem.plannedAmount - currentItem.actualAmount;
    currentItem.consumedPercentage =
      currentItem.plannedAmount > 0 ? (currentItem.actualAmount / currentItem.plannedAmount) * 100 : 0;
    byItemMap.set(consumption.categoryId, currentItem);

    const currentNature = byNatureMap.get(consumption.category.nature) ?? {
      nature: consumption.category.nature,
      plannedAmount: 0,
      actualAmount: 0,
      difference: 0
    };

    currentNature.actualAmount += actualAmount;
    currentNature.difference = currentNature.plannedAmount - currentNature.actualAmount;
    byNatureMap.set(consumption.category.nature, currentNature);

    const currentKind = byKindMap.get(consumption.category.kind) ?? {
      kind: consumption.category.kind,
      plannedAmount: 0,
      actualAmount: 0,
      difference: 0
    };

    currentKind.actualAmount += actualAmount;
    currentKind.difference = currentKind.plannedAmount - currentKind.actualAmount;
    byKindMap.set(consumption.category.kind, currentKind);
  });

  let cumulativePlanned = 0;
  let cumulativeActual = 0;

  monthly.forEach((row) => {
    row.plannedAmount = round(row.plannedAmount);
    row.actualAmount = round(row.actualAmount);
    row.difference = round(row.plannedAmount - row.actualAmount);
    cumulativePlanned = round(cumulativePlanned + row.plannedAmount);
    cumulativeActual = round(cumulativeActual + row.actualAmount);
    row.cumulativePlanned = cumulativePlanned;
    row.cumulativeActual = cumulativeActual;
    row.cumulativeDifference = round(cumulativePlanned - cumulativeActual);
  });

  const byItem = Array.from(byItemMap.values())
    .map((item) => ({
      ...item,
      plannedAmount: round(item.plannedAmount),
      actualAmount: round(item.actualAmount),
      difference: round(item.difference),
      consumedPercentage: round(item.consumedPercentage)
    }))
    .sort((left, right) => left.categoryName.localeCompare(right.categoryName));

  const byNature = Array.from(byNatureMap.values()).map((item) => ({
    ...item,
    plannedAmount: round(item.plannedAmount),
    actualAmount: round(item.actualAmount),
    difference: round(item.difference)
  }));

  const byKind = Array.from(byKindMap.values()).map((item) => ({
    ...item,
    plannedAmount: round(item.plannedAmount),
    actualAmount: round(item.actualAmount),
    difference: round(item.difference)
  }));

  const plannedIncome = byKind.find((item) => item.kind === BudgetKind.INCOME)?.plannedAmount ?? 0;
  const plannedExpense = byKind.find((item) => item.kind === BudgetKind.EXPENSE)?.plannedAmount ?? 0;
  const actualIncome = byKind.find((item) => item.kind === BudgetKind.INCOME)?.actualAmount ?? 0;
  const actualExpense = byKind.find((item) => item.kind === BudgetKind.EXPENSE)?.actualAmount ?? 0;

  return {
    year,
    totals: {
      plannedIncome,
      plannedExpense,
      actualIncome,
      actualExpense,
      plannedBalance: round(plannedIncome - plannedExpense),
      actualBalance: round(actualIncome - actualExpense)
    },
    annualBreakdown: {
      byCategory: byItem,
      byNature,
      byKind
    },
    monthlyLinearComparison: monthly,
    byNatureComparison: byNature,
    byItemComparison: byItem
  };
};
