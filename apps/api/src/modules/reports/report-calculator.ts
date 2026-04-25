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

type ReportSide = {
  incomeFixed: number;
  incomeVariable: number;
  expenseFixed: number;
  expenseVariable: number;
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
};

type MonthlyReportRow = {
  month: number;
  expenseFixed: number;
  expenseVariable: number;
  expenseTotal: number;
  incomeTotal: number;
  balance: number;
};

const toAmount = (value: AmountValue) => Number(value.toString());

const round = (value: number) => Number(value.toFixed(2));

const createEmptySide = (): ReportSide => ({
  incomeFixed: 0,
  incomeVariable: 0,
  expenseFixed: 0,
  expenseVariable: 0,
  incomeTotal: 0,
  expenseTotal: 0,
  balance: 0
});

const createEmptyMonthlyRow = (month: number): MonthlyReportRow => ({
  month,
  expenseFixed: 0,
  expenseVariable: 0,
  expenseTotal: 0,
  incomeTotal: 0,
  balance: 0
});

const assignAmount = (side: ReportSide, kind: BudgetKind, nature: BudgetNature, amount: number) => {
  if (kind === BudgetKind.INCOME && nature === BudgetNature.FIXED) {
    side.incomeFixed += amount;
    return;
  }

  if (kind === BudgetKind.INCOME && nature === BudgetNature.VARIABLE) {
    side.incomeVariable += amount;
    return;
  }

  if (kind === BudgetKind.EXPENSE && nature === BudgetNature.FIXED) {
    side.expenseFixed += amount;
    return;
  }

  side.expenseVariable += amount;
};

const finalizeSide = (side: ReportSide): ReportSide => {
  const incomeFixed = round(side.incomeFixed);
  const incomeVariable = round(side.incomeVariable);
  const expenseFixed = round(side.expenseFixed);
  const expenseVariable = round(side.expenseVariable);
  const incomeTotal = round(incomeFixed + incomeVariable);
  const expenseTotal = round(expenseFixed + expenseVariable);

  return {
    incomeFixed,
    incomeVariable,
    expenseFixed,
    expenseVariable,
    incomeTotal,
    expenseTotal,
    balance: round(incomeTotal - expenseTotal)
  };
};

const finalizeMonthlyRow = (row: MonthlyReportRow): MonthlyReportRow => {
  const expenseFixed = round(row.expenseFixed);
  const expenseVariable = round(row.expenseVariable);
  const expenseTotal = round(expenseFixed + expenseVariable);
  const incomeTotal = round(row.incomeTotal);

  return {
    month: row.month,
    expenseFixed,
    expenseVariable,
    expenseTotal,
    incomeTotal,
    balance: round(incomeTotal - expenseTotal)
  };
};

export const calculateReport = (year: number, budgets: Budget[], consumptions: Consumption[]) => {
  const planned = createEmptySide();
  const actual = createEmptySide();
  const monthlyActual = Array.from({ length: 12 }, (_, index) => createEmptyMonthlyRow(index + 1));

  budgets.forEach((budget) => {
    assignAmount(planned, budget.category.kind, budget.category.nature, toAmount(budget.plannedAmount));
  });

  consumptions.forEach((consumption) => {
    assignAmount(actual, consumption.category.kind, consumption.category.nature, toAmount(consumption.actualAmount));

    const monthRow = monthlyActual[consumption.month - 1];
    const amount = toAmount(consumption.actualAmount);

    if (consumption.category.kind === BudgetKind.INCOME) {
      monthRow.incomeTotal += amount;
      return;
    }

    if (consumption.category.nature === BudgetNature.FIXED) {
      monthRow.expenseFixed += amount;
      return;
    }

    monthRow.expenseVariable += amount;
  });

  return {
    year,
    planned: finalizeSide(planned),
    actual: finalizeSide(actual),
    monthlyActual: monthlyActual.map(finalizeMonthlyRow)
  };
};
