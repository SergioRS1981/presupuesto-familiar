import { useEffect, useMemo, useState } from "react";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { TabPanel, TabView } from "primereact/tabview";
import { api } from "./api/client";
import { Budget, Category, Consumption, Report } from "./api/types";
import { BudgetManager } from "./features/budgets/BudgetManager";
import { ConsumptionManager } from "./features/consumptions/ConsumptionManager";
import { ReportsDashboard } from "./features/reports/ReportsDashboard";
import { formatCurrency } from "./utils/format";

const currentYear = new Date().getFullYear();

export const App = () => {
  const [year, setYear] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearDialogVisible, setYearDialogVisible] = useState(false);
  const [yearToCreate, setYearToCreate] = useState<number | null>(null);
  const [creatingYear, setCreatingYear] = useState(false);

  const dashboardSummary = useMemo(() => {
    const planned = budgets.reduce((accumulator, item) => accumulator + Number(item.plannedAmount), 0);
    const actual = consumptions.reduce((accumulator, item) => accumulator + Number(item.actualAmount), 0);

    return {
      planned,
      actual
    };
  }, [budgets, consumptions]);

  const addablePastYears = useMemo(() => {
    const registeredYears = new Set(availableYears);
    const years: number[] = [];

    for (let value = currentYear - 1; value >= 2000; value -= 1) {
      if (!registeredYears.has(value)) {
        years.push(value);
      }
    }

    return years;
  }, [availableYears]);

  const loadData = async (selectedYear = year) => {
    setLoading(true);
    setError(null);

    try {
      const [loadedCategories, loadedBudgets, loadedConsumptions, loadedYears, loadedReport] = await Promise.all([
        api.getCategories(),
        api.getBudgets(selectedYear),
        api.getConsumptions(selectedYear),
        api.getYears(),
        api.getAnnualReport(selectedYear)
      ]);

      const years = loadedYears.length > 0 ? loadedYears : [selectedYear];

      setCategories(loadedCategories);
      setBudgets(loadedBudgets);
      setConsumptions(loadedConsumptions);
      setAvailableYears(Array.from(new Set([...years, selectedYear])).sort((left, right) => left - right));
      setReport(loadedReport);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(year);
  }, [year]);

  useEffect(() => {
    if (addablePastYears.length === 0) {
      setYearToCreate(null);
      return;
    }

    setYearToCreate((current) => (current !== null && addablePastYears.includes(current) ? current : addablePastYears[0]));
  }, [addablePastYears]);

  const openYearDialog = () => {
    if (addablePastYears.length === 0) {
      return;
    }

    setYearToCreate(addablePastYears[0]);
    setYearDialogVisible(true);
  };

  const handleCreateYear = async () => {
    if (yearToCreate === null) {
      return;
    }

    setCreatingYear(true);
    setError(null);

    try {
      const createdYear = await api.createYear({ year: yearToCreate });

      setAvailableYears((current) =>
        Array.from(new Set([...current, createdYear.year])).sort((left, right) => left - right)
      );
      setYearDialogVisible(false);
      setYear(createdYear.year);
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : "No se pudo crear el ano solicitado.");
    } finally {
      setCreatingYear(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero__copy">
          <span className="hero__eyebrow">Presupuesto domestico anual</span>
          <h1>Controla ingresos, gastos y desviaciones reales desde una sola vista.</h1>
          <p>
            Gestiona partidas fijas y variables, registra consumos mensuales y compara lo previsto con lo real para
            cada ano.
          </p>
        </div>

        <div className="hero__panel">
          <div className="hero__panel-row">
            <label htmlFor="year-selector">Ano de trabajo</label>
            <Dropdown
              id="year-selector"
              value={year}
              options={availableYears.map((value) => ({ label: value.toString(), value }))}
              onChange={(event: DropdownChangeEvent) => setYear(event.value)}
            />
          </div>

          <Button
            icon="pi pi-history"
            label="Anadir ano pasado"
            outlined
            onClick={openYearDialog}
            disabled={addablePastYears.length === 0}
          />

          <div className="hero__stats">
            <article>
              <span>Previsto</span>
              <strong>{formatCurrency(dashboardSummary.planned)}</strong>
            </article>
            <article>
              <span>Real</span>
              <strong>{formatCurrency(dashboardSummary.actual)}</strong>
            </article>
          </div>

          <Button icon="pi pi-refresh" label="Recargar datos" outlined onClick={() => void loadData(year)} />
        </div>
      </section>

      {error ? <Message severity="error" text={error} className="page-message" /> : null}

      <Dialog
        header="Crear ano historico"
        visible={yearDialogVisible}
        style={{ width: "28rem" }}
        onHide={() => setYearDialogVisible(false)}
        footer={
          <div className="dialog-actions">
            <Button text label="Cancelar" onClick={() => setYearDialogVisible(false)} />
            <Button label="Crear ano" loading={creatingYear} onClick={handleCreateYear} />
          </div>
        }
      >
        <div className="form-grid">
          <div className="field">
            <label htmlFor="year-create-selector">Ano historico</label>
            <Dropdown
              id="year-create-selector"
              value={yearToCreate}
              options={addablePastYears.map((value) => ({ label: value.toString(), value }))}
              onChange={(event: DropdownChangeEvent) => setYearToCreate(event.value)}
              placeholder="Selecciona un ano"
            />
          </div>
          <p className="m-0">
            Al crear el ano podras cargar presupuestos y consumos reales para ese ejercicio aunque todavia no tenga
            datos.
          </p>
        </div>
      </Dialog>

      {loading ? (
        <div className="loading-state">
          <ProgressSpinner />
        </div>
      ) : (
        <TabView className="content-tabs">
          <TabPanel header="Partidas y presupuestos">
            <BudgetManager year={year} categories={categories} budgets={budgets} onReload={() => loadData(year)} />
          </TabPanel>
          <TabPanel header="Consumos">
            <ConsumptionManager
              year={year}
              categories={categories}
              consumptions={consumptions}
              onReload={() => loadData(year)}
            />
          </TabPanel>
          <TabPanel header="Informes">
            <ReportsDashboard
              year={year}
              report={report}
              budgets={budgets}
              consumptions={consumptions}
              availableYears={availableYears}
              onError={setError}
            />
          </TabPanel>
        </TabView>
      )}
    </main>
  );
};
