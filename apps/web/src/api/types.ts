export type BudgetKind = "INCOME" | "EXPENSE";
export type BudgetNature = "FIXED" | "VARIABLE";

export type AuthSession = {
  authenticated: boolean;
  username?: string;
};

export type ConfiguredYear = {
  year: number;
  active: boolean;
};

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

export type ReportSide = {
  incomeFixed: number;
  incomeVariable: number;
  expenseFixed: number;
  expenseVariable: number;
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
};

export type MonthlyReportRow = {
  month: number;
  expenseFixed: number;
  expenseVariable: number;
  expenseTotal: number;
  incomeTotal: number;
  balance: number;
};

export type Report = {
  year: number;
  planned: ReportSide;
  actual: ReportSide;
  monthlyActual: MonthlyReportRow[];
};
