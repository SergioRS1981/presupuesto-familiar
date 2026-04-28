import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BudgetManager } from "./BudgetManager";

describe("BudgetManager", () => {
  it("abre el dialogo para crear una nueva partida", async () => {
    const user = userEvent.setup();

    const view = render(
      <BudgetManager
        year={2026}
        categories={[]}
        budgets={[]}
        onReload={vi.fn().mockResolvedValue(undefined)}
      />
    );

    await user.click(view.getByRole("button", { name: "Nueva partida" }));

    expect(view.getByLabelText("Nombre")).toBeInTheDocument();
    expect(view.getByLabelText("Descripcion")).toBeInTheDocument();
  });

  it("muestra el porcentaje de cada partida sobre el total de su tipo", () => {
    render(
      <BudgetManager
        year={2026}
        categories={[
          {
            id: "salary",
            name: "Nomina",
            description: "",
            kind: "INCOME",
            nature: "FIXED",
            active: true
          },
          {
            id: "bonus",
            name: "Bonus",
            description: "",
            kind: "INCOME",
            nature: "VARIABLE",
            active: true
          },
          {
            id: "rent",
            name: "Alquiler",
            description: "",
            kind: "EXPENSE",
            nature: "FIXED",
            active: true
          }
        ]}
        budgets={[
          {
            id: "budget-salary",
            year: 2026,
            categoryId: "salary",
            plannedAmount: 4000,
            category: {
              id: "salary",
              name: "Nomina",
              description: "",
              kind: "INCOME",
              nature: "FIXED",
              active: true
            }
          },
          {
            id: "budget-bonus",
            year: 2026,
            categoryId: "bonus",
            plannedAmount: 1000,
            category: {
              id: "bonus",
              name: "Bonus",
              description: "",
              kind: "INCOME",
              nature: "VARIABLE",
              active: true
            }
          },
          {
            id: "budget-rent",
            year: 2026,
            categoryId: "rent",
            plannedAmount: 1200,
            category: {
              id: "rent",
              name: "Alquiler",
              description: "",
              kind: "EXPENSE",
              nature: "FIXED",
              active: true
            }
          }
        ]}
        onReload={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByText("80,0 %")).toBeInTheDocument();
    expect(screen.getByText("20,0 %")).toBeInTheDocument();
    expect(screen.getByText("100,0 %")).toBeInTheDocument();
  });
});
