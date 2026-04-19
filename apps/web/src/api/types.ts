export type BudgetKind = "INCOME" | "EXPENSE";
export type BudgetNature = "FIXED" | "VARIABLE";

export type Category = {
  id: string;
  name: string;
  description?: string | null;
  kind: BudgetKind;
  nature: BudgetNature;
  active: boolean;
};

export type Budget = {
  id: string;
  year: number;
  categoryId: string;
  plannedAmount: number | string;
  category: Category;
};

export type Consumption = {
  id: string;
  year: number;
  month: number;
  categoryId: string;
  actualAmount: number | string;
  category: Category;
};

export type Report = {
  year: number;
  totals: {
    plannedIncome: number;
    plannedExpense: number;
    actualIncome: number;
    actualExpense: number;
    plannedBalance: number;
    actualBalance: number;
  };
  annualBreakdown: {
    byCategory: Array<{
      categoryId: string;
      categoryName: string;
      kind: BudgetKind;
      nature: BudgetNature;
      plannedAmount: number;
      actualAmount: number;
      difference: number;
      consumedPercentage: number;
    }>;
    byNature: Array<{
      nature: BudgetNature;
      plannedAmount: number;
      actualAmount: number;
      difference: number;
    }>;
    byKind: Array<{
      kind: BudgetKind;
      plannedAmount: number;
      actualAmount: number;
      difference: number;
    }>;
  };
  monthlyLinearComparison: Array<{
    month: number;
    plannedAmount: number;
    actualAmount: number;
    difference: number;
    cumulativePlanned: number;
    cumulativeActual: number;
    cumulativeDifference: number;
  }>;
  byNatureComparison: Array<{
    nature: BudgetNature;
    plannedAmount: number;
    actualAmount: number;
    difference: number;
  }>;
  byItemComparison: Array<{
    categoryId: string;
    categoryName: string;
    kind: BudgetKind;
    nature: BudgetNature;
    plannedAmount: number;
    actualAmount: number;
    difference: number;
    consumedPercentage: number;
  }>;
};
