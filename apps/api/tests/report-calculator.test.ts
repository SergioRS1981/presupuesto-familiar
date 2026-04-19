import { BudgetKind, BudgetNature } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { calculateReport } from "../src/modules/reports/report-calculator";

describe("calculateReport", () => {
  it("calcula agregados anuales, mensuales y porcentajes consumidos", () => {
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
        }
      ]
    );

    expect(result.totals.plannedIncome).toBe(36000);
    expect(result.totals.plannedExpense).toBe(12000);
    expect(result.totals.actualIncome).toBe(3000);
    expect(result.totals.actualExpense).toBe(1000);
    expect(result.monthlyLinearComparison[0]).toMatchObject({
      month: 1,
      plannedAmount: 4000,
      actualAmount: 4000,
      difference: 0
    });
    expect(result.byItemComparison.find((item) => item.categoryId === "mortgage")?.consumedPercentage).toBe(8.33);
  });

  it("acumula consumos sin presupuesto previo y mantiene el porcentaje consumido en cero", () => {
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

    expect(result.totals.actualExpense).toBe(250);
    expect(result.byNatureComparison).toEqual([
      {
        nature: BudgetNature.VARIABLE,
        plannedAmount: 0,
        actualAmount: 250,
        difference: -250
      }
    ]);
    expect(result.annualBreakdown.byKind).toEqual([
      {
        kind: BudgetKind.EXPENSE,
        plannedAmount: 0,
        actualAmount: 250,
        difference: -250
      }
    ]);
    expect(result.byItemComparison).toEqual([
      {
        categoryId: "groceries",
        categoryName: "Supermercado",
        kind: BudgetKind.EXPENSE,
        nature: BudgetNature.VARIABLE,
        plannedAmount: 0,
        actualAmount: 250,
        difference: -250,
        consumedPercentage: 0
      }
    ]);
    expect(result.monthlyLinearComparison[1]).toMatchObject({
      month: 2,
      plannedAmount: 0,
      actualAmount: 250,
      difference: -250,
      cumulativeDifference: -250
    });
  });
});
