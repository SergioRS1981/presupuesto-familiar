import { BudgetKind, BudgetNature } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { calculateReport } from "../src/modules/reports/report-calculator";

describe("calculateReport", () => {
  it("calcula ingresos y gastos previstos y reales desglosados por fijo y variable", () => {
    const result = calculateReport(
      2026,
      [
        {
          id: "1",
          year: 2026,
          categoryId: "mortgage",
          plannedAmount: 12000,
          category: {
            id: "mortgage",
            name: "Hipoteca",
            kind: BudgetKind.EXPENSE,
            nature: BudgetNature.FIXED
          }
        },
        {
          id: "2",
          year: 2026,
          categoryId: "salary",
          plannedAmount: 36000,
          category: {
            id: "salary",
            name: "Nomina",
            kind: BudgetKind.INCOME,
            nature: BudgetNature.FIXED
          }
        },
        {
          id: "3",
          year: 2026,
          categoryId: "freelance",
          plannedAmount: 6000,
          category: {
            id: "freelance",
            name: "Freelance",
            kind: BudgetKind.INCOME,
            nature: BudgetNature.VARIABLE
          }
        },
        {
          id: "4",
          year: 2026,
          categoryId: "travel",
          plannedAmount: 2400,
          category: {
            id: "travel",
            name: "Viajes",
            kind: BudgetKind.EXPENSE,
            nature: BudgetNature.VARIABLE
          }
        }
      ],
      [
        {
          id: "c1",
          year: 2026,
          month: 1,
          categoryId: "mortgage",
          actualAmount: 1000,
          category: {
            id: "mortgage",
            name: "Hipoteca",
            kind: BudgetKind.EXPENSE,
            nature: BudgetNature.FIXED
          }
        },
        {
          id: "c2",
          year: 2026,
          month: 1,
          categoryId: "salary",
          actualAmount: 3000,
          category: {
            id: "salary",
            name: "Nomina",
            kind: BudgetKind.INCOME,
            nature: BudgetNature.FIXED
          }
        },
        {
          id: "c3",
          year: 2026,
          month: 1,
          categoryId: "freelance",
          actualAmount: 500,
          category: {
            id: "freelance",
            name: "Freelance",
            kind: BudgetKind.INCOME,
            nature: BudgetNature.VARIABLE
          }
        },
        {
          id: "c4",
          year: 2026,
          month: 1,
          categoryId: "travel",
          actualAmount: 200,
          category: {
            id: "travel",
            name: "Viajes",
            kind: BudgetKind.EXPENSE,
            nature: BudgetNature.VARIABLE
          }
        }
      ]
    );

    expect(result.planned).toEqual({
      incomeFixed: 36000,
      incomeVariable: 6000,
      expenseFixed: 12000,
      expenseVariable: 2400,
      incomeTotal: 42000,
      expenseTotal: 14400,
      balance: 27600
    });
    expect(result.actual).toEqual({
      incomeFixed: 3000,
      incomeVariable: 500,
      expenseFixed: 1000,
      expenseVariable: 200,
      incomeTotal: 3500,
      expenseTotal: 1200,
      balance: 2300
    });
    expect(result.monthlyActual[0]).toEqual({
      month: 1,
      expenseFixed: 1000,
      expenseVariable: 200,
      expenseTotal: 1200,
      incomeTotal: 3500,
      balance: 2300
    });
    expect(result.monthlyActual[1]).toEqual({
      month: 2,
      expenseFixed: 0,
      expenseVariable: 0,
      expenseTotal: 0,
      incomeTotal: 0,
      balance: 0
    });
  });

  it("acumula consumos reales aunque no exista presupuesto previo", () => {
    const result = calculateReport(
      2026,
      [],
      [
        {
          id: "c3",
          year: 2026,
          month: 2,
          categoryId: "groceries",
          actualAmount: 250,
          category: {
            id: "groceries",
            name: "Supermercado",
            kind: BudgetKind.EXPENSE,
            nature: BudgetNature.VARIABLE
          }
        }
      ]
    );

    expect(result.planned).toEqual({
      incomeFixed: 0,
      incomeVariable: 0,
      expenseFixed: 0,
      expenseVariable: 0,
      incomeTotal: 0,
      expenseTotal: 0,
      balance: 0
    });
    expect(result.actual).toEqual({
      incomeFixed: 0,
      incomeVariable: 0,
      expenseFixed: 0,
      expenseVariable: 250,
      incomeTotal: 0,
      expenseTotal: 250,
      balance: -250
    });
    expect(result.monthlyActual[1]).toEqual({
      month: 2,
      expenseFixed: 0,
      expenseVariable: 250,
      expenseTotal: 250,
      incomeTotal: 0,
      balance: -250
    });
  });
});
