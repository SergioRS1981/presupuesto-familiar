import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

const { excelImportMock } = vi.hoisted(() => ({
  excelImportMock: {
    downloadCategoryTemplateWorkbook: vi.fn(),
    downloadBudgetTemplateWorkbook: vi.fn(),
    downloadConsumptionTemplateWorkbook: vi.fn(),
    readCategoryImportFile: vi.fn(),
    readBudgetImportFile: vi.fn(),
    readConsumptionImportFile: vi.fn(),
    getCategoryLookupKey: vi.fn((value: string) => value.trim().toLowerCase())
  }
}));

vi.mock("../api/client", () => ({
  api: apiMock
}));

vi.mock("./imports/excel-import", () => excelImportMock);

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
    const [sortMeta, setSortMeta] = React.useState<{ field: string; order: 1 | -1 } | null>(null);
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

    const sortedValue = sortMeta
      ? [...value].sort((left: Record<string, unknown>, right: Record<string, unknown>) => {
          const leftValue = getFieldValue(left, sortMeta.field);
          const rightValue = getFieldValue(right, sortMeta.field);

          if (leftValue === rightValue) {
            return 0;
          }

          if (leftValue === undefined || leftValue === null) {
            return 1 * sortMeta.order;
          }

          if (rightValue === undefined || rightValue === null) {
            return -1 * sortMeta.order;
          }

          if (typeof leftValue === "number" && typeof rightValue === "number") {
            return (leftValue - rightValue) * sortMeta.order;
          }

          return String(leftValue).localeCompare(String(rightValue), "es") * sortMeta.order;
        })
      : value;

    return (
      <table>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>
                {column.props.sortable && column.props.field ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSortMeta((current) => {
                        if (current && current.field === column.props.field) {
                          return {
                            field: column.props.field,
                            order: current.order === 1 ? -1 : 1
                          };
                        }

                        return { field: column.props.field, order: 1 };
                      })
                    }
                  >
                    {column.props.header}
                  </button>
                ) : (
                  column.props.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedValue.map((row: Record<string, unknown>, rowIndex: number) => (
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
  note: "Recibo domiciliado",
  category: expenseCategory
};

const groceryCategory: Category = {
  id: "groceries",
  name: "Supermercado",
  description: "Compra habitual",
  kind: "EXPENSE",
  nature: "VARIABLE",
  active: true
};

const februaryConsumption: Consumption = {
  id: "consumption-2",
  year: 2026,
  month: 2,
  categoryId: groceryCategory.id,
  actualAmount: 250,
  note: null,
  category: groceryCategory
};

const salaryCategory: Category = {
  id: "salary",
  name: "Nomina",
  description: "Ingreso principal",
  kind: "INCOME",
  nature: "FIXED",
  active: true
};

const marchConsumption: Consumption = {
  id: "consumption-3",
  year: 2026,
  month: 3,
  categoryId: salaryCategory.id,
  actualAmount: 2200,
  note: "Ingreso mensual",
  category: salaryCategory
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
    excelImportMock.downloadCategoryTemplateWorkbook.mockResolvedValue(undefined);
    excelImportMock.downloadBudgetTemplateWorkbook.mockResolvedValue(undefined);
    excelImportMock.downloadConsumptionTemplateWorkbook.mockResolvedValue(undefined);
    excelImportMock.readCategoryImportFile.mockResolvedValue([
      {
        name: "Seguro",
        description: "Hogar",
        kind: "EXPENSE",
        nature: "FIXED",
        active: true
      }
    ]);
    excelImportMock.readBudgetImportFile.mockResolvedValue([
      {
        year: 2026,
        categoryName: "Hipoteca",
        plannedAmount: 9000
      }
    ]);
    excelImportMock.readConsumptionImportFile.mockResolvedValue([
      {
        year: 2026,
        month: 2,
        categoryName: "Hipoteca",
        actualAmount: 150
      }
    ]);
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

    await user.upload(screen.getByLabelText("Importar Excel partidas fichero"), new File(["ok"], "partidas.xlsx"));
    await waitFor(() => expect(apiMock.createCategory).toHaveBeenCalledWith(expect.objectContaining({ name: "Seguro" })));

    await user.upload(
      screen.getByLabelText("Importar Excel presupuestos fichero"),
      new File(["ok"], "presupuestos.xlsx")
    );
    await waitFor(() =>
      expect(apiMock.saveBudget).toHaveBeenCalledWith({
        year: 2026,
        categoryId: "mortgage",
        plannedAmount: 9000
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

    const table = screen.getByRole("table");

    expect(screen.getByText("Total registrado")).toBeInTheDocument();
    expect(within(table).getByText("Enero")).toBeInTheDocument();
    expect(within(table).getByText("Gasto")).toBeInTheDocument();
    expect(within(table).getByText("Fija")).toBeInTheDocument();
    expect(within(table).getByText("Recibo domiciliado")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "pi pi-trash" }));
    await waitFor(() => expect(apiMock.deleteConsumption).toHaveBeenCalledWith("consumption-1"));

    await user.click(screen.getByRole("button", { name: "Nuevo consumo" }));
    fireEvent.change(screen.getByLabelText("Mes"), { target: { value: "1" } });
    expect(
      screen.getByText("Ya existe un consumo para esa partida y mes. Debes modificarlo desde la accion Editar de la tabla.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await user.click(screen.getByRole("button", { name: "pi pi-pencil" }));
    fireEvent.change(screen.getByLabelText("Importe real"), { target: { value: "180" } });
    fireEvent.change(screen.getByLabelText("Nota opcional"), { target: { value: "Recibo revisado" } });
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(apiMock.saveConsumption).toHaveBeenCalledWith({
        year: 2026,
        categoryId: "mortgage",
        month: 1,
        actualAmount: 180,
        note: "Recibo revisado"
      })
    );

    await user.click(screen.getByRole("button", { name: "Nuevo consumo" }));
    fireEvent.change(screen.getByLabelText("Mes"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Importe real"), { target: { value: "150" } });
    fireEvent.change(screen.getByLabelText("Nota opcional"), { target: { value: "Pago puntual" } });
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(apiMock.saveConsumption).toHaveBeenCalledWith({
        year: 2026,
        categoryId: "mortgage",
        month: 2,
        actualAmount: 150,
        note: "Pago puntual"
      })
    );

    await user.upload(
      screen.getByLabelText("Importar Excel consumos fichero"),
      new File(["ok"], "consumos.xlsx")
    );
    await waitFor(() =>
      expect(apiMock.saveConsumption).toHaveBeenCalledWith({
        year: 2026,
        categoryId: "mortgage",
        month: 2,
        actualAmount: 150,
        note: null
      })
    );
    expect(onReload).toHaveBeenCalled();
  });

  it("permite ordenar la tabla de consumos por columnas salvo nota y acciones", async () => {
    const user = userEvent.setup();

    render(
      <ConsumptionManager
        year={2026}
        categories={[expenseCategory, groceryCategory, salaryCategory]}
        consumptions={[januaryConsumption, februaryConsumption, marchConsumption]}
        onReload={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const getFirstRowText = () => screen.getAllByRole("row")[1].textContent ?? "";

    expect(getFirstRowText()).toContain("Hipoteca");

    await user.click(screen.getByRole("button", { name: "Partida" }));
    expect(getFirstRowText()).toContain("Hipoteca");

    await user.click(screen.getByRole("button", { name: "Partida" }));
    expect(getFirstRowText()).toContain("Supermercado");

    await user.click(screen.getByRole("button", { name: "Importe real" }));
    expect(getFirstRowText()).toContain("Supermercado");

    await user.click(screen.getByRole("button", { name: "Importe real" }));
    expect(getFirstRowText()).toContain("Nomina");

    expect(screen.queryByRole("button", { name: "Nota" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Acciones" })).not.toBeInTheDocument();
  });

  it("permite combinar filtros de consumos por partida, mes, tipo y naturaleza", async () => {
    const user = userEvent.setup();

    render(
      <ConsumptionManager
        year={2026}
        categories={[expenseCategory, groceryCategory, salaryCategory]}
        consumptions={[januaryConsumption, februaryConsumption, marchConsumption]}
        onReload={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const table = screen.getByRole("table");

    expect(within(table).getByText("Hipoteca")).toBeInTheDocument();
    expect(within(table).getByText("Supermercado")).toBeInTheDocument();
    expect(within(table).getByText("Nomina")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filtrar por tipo"), { target: { value: "EXPENSE" } });
    expect(within(table).getByText("Hipoteca")).toBeInTheDocument();
    expect(within(table).getByText("Supermercado")).toBeInTheDocument();
    expect(within(table).queryByText("Nomina")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filtrar por naturaleza"), { target: { value: "VARIABLE" } });
    expect(within(table).getByText("Supermercado")).toBeInTheDocument();
    expect(within(table).queryByText("Hipoteca")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filtrar por mes"), { target: { value: "2" } });
    expect(within(table).getByText("Supermercado")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filtrar por partida"), { target: { value: "groceries" } });
    expect(within(table).getByText("Supermercado")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(within(table).getByText("Hipoteca")).toBeInTheDocument();
    expect(within(table).getByText("Supermercado")).toBeInTheDocument();
    expect(within(table).getByText("Nomina")).toBeInTheDocument();
  });

  it("muestra el estado vacio del informe cuando no hay datos", () => {
    render(<ReportsDashboard year={2026} report={null} budgets={[]} consumptions={[]} availableYears={[2026]} />);

    expect(screen.getByText("Todavia no hay datos para generar informes del ano seleccionado.")).toBeInTheDocument();
  });
});
