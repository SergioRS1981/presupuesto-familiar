import { useEffect, useMemo, useState } from "react";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
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

  const dashboardSummary = useMemo(() => {
    const planned = budgets.reduce((accumulator, item) => accumulator + Number(item.plannedAmount), 0);
    const actual = consumptions.reduce((accumulator, item) => accumulator + Number(item.actualAmount), 0);

    return {
      planned,
      actual
    };
  }, [budgets, consumptions]);

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
            <ReportsDashboard year={year} report={report} />
          </TabPanel>
        </TabView>
      )}
    </main>
  );
};
