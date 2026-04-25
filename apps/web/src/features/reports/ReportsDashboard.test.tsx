import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReportsDashboard } from "./ReportsDashboard";

describe("ReportsDashboard", () => {
  it("muestra el informe anual simplificado con previsto, real y diferencia", () => {
    const view = render(
      <ReportsDashboard
        year={2026}
        availableYears={[2025, 2026]}
        budgets={[
          {
            id: "b1",
            year: 2026,
            categoryId: "salary",
            plannedAmount: 36000,
            category: {
              id: "salary",
              name: "Nomina",
              kind: "INCOME",
              nature: "FIXED",
              active: true
            }
          },
          {
            id: "b2",
            year: 2026,
            categoryId: "travel",
            plannedAmount: 2400,
            category: {
              id: "travel",
              name: "Viajes",
              kind: "EXPENSE",
              nature: "VARIABLE",
              active: true
            }
          }
        ]}
        consumptions={[
          {
            id: "c1",
            year: 2026,
            month: 1,
            categoryId: "salary",
            actualAmount: 3000,
            category: {
              id: "salary",
              name: "Nomina",
              kind: "INCOME",
              nature: "FIXED",
              active: true
            }
          },
          {
            id: "c2",
            year: 2026,
            month: 1,
            categoryId: "travel",
            actualAmount: 200,
            category: {
              id: "travel",
              name: "Viajes",
              kind: "EXPENSE",
              nature: "VARIABLE",
              active: true
            }
          }
        ]}
        report={{
          year: 2026,
          planned: {
            incomeFixed: 36000,
            incomeVariable: 6000,
            expenseFixed: 12000,
            expenseVariable: 2400,
            incomeTotal: 42000,
            expenseTotal: 14400,
            balance: 27600
          },
          actual: {
            incomeFixed: 3000,
            incomeVariable: 500,
            expenseFixed: 1000,
            expenseVariable: 200,
            incomeTotal: 3500,
            expenseTotal: 1200,
            balance: 2300
          },
          monthlyActual: [
            { month: 1, expenseFixed: 1000, expenseVariable: 200, expenseTotal: 1200, incomeTotal: 3500, balance: 2300 },
            { month: 2, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 3, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 4, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 5, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 6, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 7, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 8, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 9, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 10, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 11, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 12, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 }
          ]
        }}
      />
    );

    expect(view.getByText("Ingresos fijos")).toBeInTheDocument();
    expect(view.getByText("Total gastos")).toBeInTheDocument();
    expect(view.getAllByText("Balance").length).toBeGreaterThan(1);
    expect(view.getAllByText("Previsto").length).toBeGreaterThan(1);
    expect(view.getAllByText("Real").length).toBeGreaterThan(1);
    expect(view.getAllByText("Diferencia").length).toBeGreaterThan(1);
    expect(view.getAllByText("Gastos fijos").length).toBeGreaterThan(1);
    expect(view.getAllByText("Gastos variables").length).toBeGreaterThan(1);
    expect(view.getByText("Gastos totales")).toBeInTheDocument();
    expect(view.getByText("Enero")).toBeInTheDocument();
    expect(view.getByText("Partida")).toBeInTheDocument();
    expect(view.getByText("Nomina")).toBeInTheDocument();
    expect(view.getByText("Viajes")).toBeInTheDocument();
    expect(view.getAllByText(/42\.000,00/).length).toBeGreaterThan(0);
    expect(view.getAllByText(/-33\.000,00.+8,3 %/).length).toBeGreaterThan(0);
    expect(view.getAllByText(/-25\.300,00.+8,3 %/).length).toBeGreaterThan(0);
    expect(view.getAllByText(/-33\.000,00.+8,3 %/).length).toBeGreaterThan(1);
  });

  it("marca como sin previsto los porcentajes no comparables", () => {
    const view = render(
      <ReportsDashboard
        year={2026}
        availableYears={[2026]}
        budgets={[]}
        consumptions={[
          {
            id: "c-income",
            year: 2026,
            month: 1,
            categoryId: "gift",
            actualAmount: 500,
            category: {
              id: "gift",
              name: "Regalo",
              kind: "INCOME",
              nature: "VARIABLE",
              active: true
            }
          }
        ]}
        report={{
          year: 2026,
          planned: {
            incomeFixed: 0,
            incomeVariable: 0,
            expenseFixed: 0,
            expenseVariable: 0,
            incomeTotal: 0,
            expenseTotal: 0,
            balance: 0
          },
          actual: {
            incomeFixed: 500,
            incomeVariable: 0,
            expenseFixed: 0,
            expenseVariable: 0,
            incomeTotal: 500,
            expenseTotal: 0,
            balance: 500
          },
          monthlyActual: [
            { month: 1, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 500, balance: 500 },
            { month: 2, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 3, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 4, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 5, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 6, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 7, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 8, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 9, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 10, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 11, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 },
            { month: 12, expenseFixed: 0, expenseVariable: 0, expenseTotal: 0, incomeTotal: 0, balance: 0 }
          ]
        }}
      />
    );

    expect(view.getAllByText(/Sin previsto/).length).toBeGreaterThan(0);
    expect(view.getByText("Regalo")).toBeInTheDocument();
  });
});
