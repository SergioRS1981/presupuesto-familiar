import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BudgetManager } from "./budgets/BudgetManager";
import { ConsumptionManager } from "./consumptions/ConsumptionManager";
import { ReportsDashboard } from "./reports/ReportsDashboard";
import { Budget, Category, Consumption } from "../api/types";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    saveBudget: vi.fn(),
    deleteBudget: vi.fn(),
    saveConsumption: vi.fn(),
    deleteConsumption: vi.fn()
  }
}));

vi.mock("../api/client", () => ({
  api: apiMock
}));

vi.mock("primereact/button", () => ({
  Button: ({ label, icon, onClick, disabled, children }: any) => (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label ?? icon}>
      {label ?? icon ?? children}
    </button>
  )
}));

vi.mock("primereact/card", () => ({
  Card: ({ title, subTitle, children, ...props }: any) => (
    <section {...props}>
      {title ? <h2>{title}</h2> : null}
      {subTitle ? <p>{subTitle}</p> : null}
      {children}
    </section>
  )
}));

vi.mock("primereact/dialog", () => ({
  Dialog: ({ visible, header, children, footer }: any) =>
    visible ? (
      <div role="dialog" aria-label={header}>
        <h3>{header}</h3>
        {children}
        {footer}
      </div>
    ) : null
}));

vi.mock("primereact/dropdown", () => ({
  Dropdown: ({ id, value, options, onChange, placeholder }: any) => (
    <select
      id={id}
      value={value ?? ""}
      onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOption = options.find(
          (option: { label: string; value: string | number }) => String(option.value) === event.target.value
        );

        onChange({ value: selectedOption ? selectedOption.value : event.target.value });
      }}
    >
      <option value="">{placeholder ?? "Selecciona"}</option>
      {options.map((option: { label: string; value: string | number }) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}));

vi.mock("primereact/inputnumber", () => ({
  InputNumber: ({ inputId, value, onValueChange }: any) => (
    <input
      id={inputId}
      type="number"
      value={value}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => onValueChange({ value: Number(event.target.value) })}
    />
  )
}));

vi.mock("primereact/inputswitch", () => ({
  InputSwitch: ({ inputId, checked, onChange }: any) => (
    <input
      id={inputId}
      type="checkbox"
      checked={checked}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange({ value: event.target.checked })}
    />
  )
}));

vi.mock("primereact/inputtext", () => ({
  InputText: ({ id, value, onChange }: any) => <input id={id} value={value} onChange={onChange} />
}));

vi.mock("primereact/tag", () => ({
  Tag: ({ value }: any) => <span>{value}</span>
}));

vi.mock("primereact/chart", () => ({
  Chart: () => <div data-testid="chart-mock" />
}));

vi.mock("primereact/column", () => ({
  Column: () => null
}));

vi.mock("primereact/datatable", () => ({
  DataTable: ({ value, children, emptyMessage }: any) => {
    const columns = React.Children.toArray(children) as React.ReactElement[];

    if (!value.length) {
      return <div>{emptyMessage}</div>;
    }

    const getFieldValue = (row: Record<string, unknown>, field?: string) =>
      field?.split(".").reduce<unknown>((current, segment) => {
        if (current && typeof current === "object") {
          return (current as Record<string, unknown>)[segment];
        }

        return undefined;
      }, row);

    return (
      <table>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column.props.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {value.map((row: Record<string, unknown>, rowIndex: number) => (
            <tr key={String(row.id ?? rowIndex)}>
              {columns.map((column, columnIndex) => (
                <td key={columnIndex}>
                  {column.props.body ? column.props.body(row) : String(getFieldValue(row, column.props.field) ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}));

const expenseCategory: Category = {
  id: "mortgage",
  name: "Hipoteca",
  description: "Cuota mensual",
  kind: "EXPENSE",
  nature: "FIXED",
  active: true
};

const expenseBudget: Budget = {
  id: "budget-1",
  year: 2026,
  categoryId: expenseCategory.id,
  plannedAmount: 12000,
  category: expenseCategory
};

const januaryConsumption: Consumption = {
  id: "consumption-1",
  year: 2026,
  month: 1,
  categoryId: expenseCategory.id,
  actualAmount: 1000,
  category: expenseCategory
};

describe("Cobertura Sonar", () => {
  beforeEach(() => {
    apiMock.createCategory.mockResolvedValue(expenseCategory);
    apiMock.updateCategory.mockResolvedValue(expenseCategory);
    apiMock.deleteCategory.mockResolvedValue(undefined);
    apiMock.saveBudget.mockResolvedValue(expenseBudget);
    apiMock.deleteBudget.mockResolvedValue(undefined);
    apiMock.saveConsumption.mockResolvedValue(januaryConsumption);
    apiMock.deleteConsumption.mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("cubre la gestion de partidas y presupuesto anual", async () => {
    const user = userEvent.setup();
    const onReload = vi.fn().mockResolvedValue(undefined);

    render(<BudgetManager year={2026} categories={[expenseCategory]} budgets={[expenseBudget]} onReload={onReload} />);

    expect(screen.getAllByText("Hipoteca").length).toBe(2);
    expect(screen.getAllByText("Gasto").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Fija").length).toBeGreaterThan(0);
    expect(screen.getByText("Activa")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nueva partida" }));
    await user.type(screen.getByLabelText("Nombre"), "Seguro");
    fireEvent.change(screen.getByLabelText("Naturaleza"), { target: { value: "VARIABLE" } });
    fireEvent.click(screen.getByLabelText("Activa"));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(apiMock.createCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Seguro",
          nature: "VARIABLE",
          active: false
        })
      )
    );

    await user.click(screen.getByRole("button", { name: "Configurar importe" }));
    fireEvent.change(screen.getByLabelText("Importe anual previsto"), { target: { value: "8000" } });
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(apiMock.saveBudget).toHaveBeenCalledWith({
        year: 2026,
        categoryId: "mortgage",
        plannedAmount: 8000
      })
    );
    expect(onReload).toHaveBeenCalled();
  });

  it("cubre el registro y borrado de consumos mensuales", async () => {
    const user = userEvent.setup();
    const onReload = vi.fn().mockResolvedValue(undefined);

    render(
      <ConsumptionManager
        year={2026}
        categories={[expenseCategory]}
        consumptions={[januaryConsumption]}
        onReload={onReload}
      />
    );

    expect(screen.getByText("Total registrado")).toBeInTheDocument();
    expect(screen.getByText("Enero")).toBeInTheDocument();
    expect(screen.getAllByText("Gasto").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Fija").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "pi pi-trash" }));
    await waitFor(() => expect(apiMock.deleteConsumption).toHaveBeenCalledWith("consumption-1"));

    await user.click(screen.getByRole("button", { name: "Nuevo consumo" }));
    fireEvent.change(screen.getByLabelText("Mes"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Importe real"), { target: { value: "150" } });
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(apiMock.saveConsumption).toHaveBeenCalledWith({
        year: 2026,
        categoryId: "mortgage",
        month: 2,
        actualAmount: 150
      })
    );
    expect(onReload).toHaveBeenCalled();
  });

  it("muestra el estado vacio del informe cuando no hay datos", () => {
    render(<ReportsDashboard year={2026} report={null} />);

    expect(screen.getByText("Todavia no hay datos para generar informes del ano seleccionado.")).toBeInTheDocument();
  });
});
