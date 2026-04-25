import { describe, expect, it } from "vitest";
import { buildReportCsv, buildYearTotalsCsv } from "./report-export";

describe("report-export", () => {
  it("genera un CSV completo del informe anual con sus secciones", () => {
    const csv = buildReportCsv({
      year: 2026,
      budgets: [
        {
          id: "budget-salary",
          year: 2026,
          categoryId: "salary",
          plannedAmount: 36000,
          category: {
            id: "salary",
            name: "Nomina",
            description: null,
            kind: "INCOME",
            nature: "FIXED",
            active: true
          }
        }
      ],
      consumptions: [
        {
          id: "consumption-salary",
          year: 2026,
          month: 1,
          categoryId: "salary",
          actualAmount: 3000,
          category: {
            id: "salary",
            name: "Nomina",
            description: null,
            kind: "INCOME",
            nature: "FIXED",
            active: true
          }
        }
      ],
      report: {
        year: 2026,
        planned: {
          incomeFixed: 36000,
          incomeVariable: 0,
          expenseFixed: 12000,
          expenseVariable: 2400,
          incomeTotal: 36000,
          expenseTotal: 14400,
          balance: 21600
        },
        actual: {
          incomeFixed: 3000,
          incomeVariable: 0,
          expenseFixed: 1000,
          expenseVariable: 200,
          incomeTotal: 3000,
          expenseTotal: 1200,
          balance: 1800
        },
        monthlyActual: [
          { month: 1, expenseFixed: 1000, expenseVariable: 200, expenseTotal: 1200, incomeTotal: 3000, balance: 1800 },
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
      }
    });

    expect(csv).toContain("Informe anual 2026");
    expect(csv).toContain("Resumen anual");
    expect(csv).toContain("Detalle mensual real");
    expect(csv).toContain("Detalle por partida");
    expect(csv).toContain("Nomina");
    expect(csv).toContain("Enero");
  });

  it("genera un CSV de totales anuales ordenado por ano", () => {
    const csv = buildYearTotalsCsv([
      {
        year: 2026,
        planned: {
          incomeFixed: 36000,
          incomeVariable: 0,
          expenseFixed: 12000,
          expenseVariable: 2400,
          incomeTotal: 36000,
          expenseTotal: 14400,
          balance: 21600
        },
        actual: {
          incomeFixed: 3000,
          incomeVariable: 0,
          expenseFixed: 1000,
          expenseVariable: 200,
          incomeTotal: 3000,
          expenseTotal: 1200,
          balance: 1800
        },
        monthlyActual: []
      },
      {
        year: 2025,
        planned: {
          incomeFixed: 30000,
          incomeVariable: 1000,
          expenseFixed: 10000,
          expenseVariable: 1200,
          incomeTotal: 31000,
          expenseTotal: 11200,
          balance: 19800
        },
        actual: {
          incomeFixed: 29000,
          incomeVariable: 800,
          expenseFixed: 9800,
          expenseVariable: 1400,
          incomeTotal: 29800,
          expenseTotal: 11200,
          balance: 18600
        },
        monthlyActual: []
      }
    ]);

    expect(csv).toContain("Totales anuales");
    expect(csv.indexOf("2025")).toBeLessThan(csv.indexOf("2026"));
    expect(csv).toContain("Balance real");
  });
});
