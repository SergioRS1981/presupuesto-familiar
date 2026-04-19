import { render } from "@testing-library/react";
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
});
