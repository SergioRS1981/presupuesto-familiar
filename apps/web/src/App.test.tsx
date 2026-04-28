import type { ChangeEvent } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const currentYear = new Date().getFullYear();

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    getSession: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getCategories: vi.fn(),
    getBudgets: vi.fn(),
    getConsumptions: vi.fn(),
    getYears: vi.fn(),
    getAnnualReport: vi.fn(),
    createYear: vi.fn(),
    updateYearStatus: vi.fn()
  }
}));

vi.mock("./api/client", () => ({
  api: apiMock
}));

vi.mock("primereact/message", () => ({
  Message: ({ text }: { text: string }) => <div>{text}</div>
}));

vi.mock("primereact/progressspinner", () => ({
  ProgressSpinner: () => <div>Cargando</div>
}));

vi.mock("primereact/button", () => ({
  Button: ({ label, icon, onClick, disabled, children }: any) => (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label ?? icon}>
      {label ?? icon ?? children}
    </button>
  )
}));

vi.mock("primereact/dialog", () => ({
  Dialog: ({ visible, header, children, footer }: any) =>
    visible ? (
      <div role="dialog" aria-label={header}>
        <h2>{header}</h2>
        {children}
        {footer}
      </div>
    ) : null
}));

vi.mock("primereact/dropdown", () => ({
  Dropdown: ({ id, value, options, onChange, placeholder }: any) => (
    <select
      id={id}
      aria-label={id}
      value={value ?? ""}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => {
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

vi.mock("primereact/inputswitch", () => ({
  InputSwitch: ({ inputId, checked, disabled, onChange }: any) => (
    <input
      id={inputId}
      aria-label={inputId}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ value: event.target.checked })}
    />
  )
}));

vi.mock("primereact/tabview", () => ({
  TabView: ({ children }: any) => <div>{children}</div>,
  TabPanel: ({ header, children }: any) => (
    <section>
      <h3>{header}</h3>
      {children}
    </section>
  )
}));

vi.mock("./features/budgets/BudgetManager", () => ({
  BudgetManager: ({ year }: { year: number }) => <div>Presupuestos {year}</div>
}));

vi.mock("./features/consumptions/ConsumptionManager", () => ({
  ConsumptionManager: ({ year }: { year: number }) => <div>Consumos {year}</div>
}));

vi.mock("./features/reports/ReportsDashboard", () => ({
  ReportsDashboard: ({ year }: { year: number }) => <div>Informes {year}</div>
}));

describe("App", () => {
  beforeEach(() => {
    const yearsState = [{ year: currentYear, active: true }];

    apiMock.getSession.mockResolvedValue({ authenticated: true, username: "sergio" });
    apiMock.login.mockResolvedValue({ authenticated: true, username: "sergio" });
    apiMock.logout.mockResolvedValue(undefined);
    apiMock.getCategories.mockResolvedValue([]);
    apiMock.getBudgets.mockResolvedValue([]);
    apiMock.getConsumptions.mockResolvedValue([]);
    apiMock.getYears.mockImplementation(async () => yearsState);
    apiMock.getAnnualReport.mockResolvedValue({
      year: currentYear,
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
        incomeFixed: 0,
        incomeVariable: 0,
        expenseFixed: 0,
        expenseVariable: 0,
        incomeTotal: 0,
        expenseTotal: 0,
        balance: 0
      },
      monthlyActual: Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        expenseFixed: 0,
        expenseVariable: 0,
        expenseTotal: 0,
        incomeTotal: 0,
        balance: 0
      }))
    });
    apiMock.createYear.mockImplementation(async ({ year }: { year: number }) => {
      const createdYear = { year, active: true };
      yearsState.push(createdYear);
      return createdYear;
    });
    apiMock.updateYearStatus.mockImplementation(async (year: number, payload: { active: boolean }) => ({
      year,
      active: payload.active
    }));
  });

  it("permite crear un ano pasado y cambiar el contexto de trabajo a ese ejercicio", async () => {
    const user = userEvent.setup();
    const { App } = await import("./App");

    render(<App />);

    await waitFor(() => expect(apiMock.getYears).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: "Gestionar anos" }));

    expect(screen.getByRole("dialog", { name: "Gestion de anos" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("year-create-selector"), { target: { value: String(currentYear - 1) } });
    await user.click(screen.getByRole("button", { name: "Anadir ano pasado" }));

    await waitFor(() => expect(apiMock.createYear).toHaveBeenCalledWith({ year: currentYear - 1 }));
    await waitFor(() => expect(apiMock.getBudgets).toHaveBeenCalledWith(currentYear - 1));
    expect(screen.getByText(`Presupuestos ${currentYear - 1}`)).toBeInTheDocument();
  });

  it("permite activar y desactivar anos y navega solo entre anos activos", async () => {
    apiMock.getYears.mockResolvedValue([
      { year: currentYear - 1, active: true },
      { year: currentYear, active: true }
    ]);

    const user = userEvent.setup();
    const { App } = await import("./App");

    render(<App />);

    await waitFor(() => expect(apiMock.getYears).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "Gestionar anos" }));
    await user.click(screen.getByLabelText(`year-active-${currentYear}`));

    await waitFor(() => expect(apiMock.updateYearStatus).toHaveBeenCalledWith(currentYear, { active: false }));
    await waitFor(() => expect(screen.getByText(`Presupuestos ${currentYear - 1}`)).toBeInTheDocument());
  });

  it("muestra el formulario de acceso y autentica al usuario", async () => {
    apiMock.getSession.mockResolvedValue({ authenticated: false });

    const user = userEvent.setup();
    const { App } = await import("./App");

    render(<App />);

    expect(await screen.findByRole("heading", { name: /inicia sesion/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Usuario"), "sergio");
    await user.type(screen.getByLabelText("Contrasena"), "Presupuesto.Dev.2026!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() =>
      expect(apiMock.login).toHaveBeenCalledWith({
        username: "sergio",
        password: "Presupuesto.Dev.2026!"
      })
    );
    await waitFor(() => expect(apiMock.getYears).toHaveBeenCalled());
  });

  it("muestra el boton Desconectar en la cabecera y permite desloguearse", async () => {
    const user = userEvent.setup();
    const { App } = await import("./App");

    render(<App />);

    await waitFor(() => expect(apiMock.getYears).toHaveBeenCalled());
    expect(screen.getByText(/una semana despues del login/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Desconectar" }));

    await waitFor(() => expect(apiMock.logout).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument());
  }, 10000);
});
