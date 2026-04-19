import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReportsDashboard } from "./ReportsDashboard";

vi.mock("primereact/chart", () => ({
  Chart: () => <div data-testid="chart-mock" />
}));

describe("ReportsDashboard", () => {
  it("muestra el informe anual con comparativas y totales", () => {
    const view = render(
      <ReportsDashboard
        year={2026}
        report={{
          year: 2026,
          totals: {
            plannedIncome: 36000,
            plannedExpense: 12000,
            actualIncome: 3000,
            actualExpense: 1000,
            plannedBalance: 24000,
            actualBalance: 2000
          },
          annualBreakdown: {
            byCategory: [
              {
                categoryId: "mortgage",
                categoryName: "Hipoteca",
                kind: "EXPENSE",
                nature: "FIXED",
                plannedAmount: 12000,
                actualAmount: 1000,
                difference: 11000,
                consumedPercentage: 8.33
              }
            ],
            byNature: [
              {
                nature: "FIXED",
                plannedAmount: 48000,
                actualAmount: 4000,
                difference: 44000
              }
            ],
            byKind: [
              {
                kind: "INCOME",
                plannedAmount: 36000,
                actualAmount: 3000,
                difference: 33000
              }
            ]
          },
          monthlyLinearComparison: [
            {
              month: 1,
              plannedAmount: 4000,
              actualAmount: 4000,
              difference: 0,
              cumulativePlanned: 4000,
              cumulativeActual: 4000,
              cumulativeDifference: 0
            }
          ],
          byNatureComparison: [
            {
              nature: "FIXED",
              plannedAmount: 48000,
              actualAmount: 4000,
              difference: 44000
            }
          ],
          byItemComparison: [
            {
              categoryId: "mortgage",
              categoryName: "Hipoteca",
              kind: "EXPENSE",
              nature: "FIXED",
              plannedAmount: 12000,
              actualAmount: 1000,
              difference: 11000,
              consumedPercentage: 8.33
            }
          ]
        }}
      />
    );

    expect(view.getByText("Ingresos previstos")).toBeInTheDocument();
    expect(view.getByText("Hipoteca")).toBeInTheDocument();
    expect(view.getAllByText(/12\.000,00/).length).toBeGreaterThan(0);
  });
});
