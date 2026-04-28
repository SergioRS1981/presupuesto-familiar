import { useEffect, useMemo, useState } from "react";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { TabPanel, TabView } from "primereact/tabview";
import { api, UnauthorizedError } from "./api/client";
import { AuthSession, Budget, Category, Consumption, Report } from "./api/types";
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
  const [authChecking, setAuthChecking] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [yearDialogVisible, setYearDialogVisible] = useState(false);
  const [yearToCreate, setYearToCreate] = useState<number | null>(null);
  const [creatingYear, setCreatingYear] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const resetDashboardState = () => {
    setCategories([]);
    setBudgets([]);
    setConsumptions([]);
    setReport(null);
    setAvailableYears([currentYear]);
    setYear(currentYear);
  };

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
      if (loadError instanceof UnauthorizedError) {
        setSession(null);
        resetDashboardState();
        setLoginError(loadError.message);
        return;
      }

      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      setAuthChecking(true);

      try {
        const currentSession = await api.getSession();

        if (currentSession.authenticated) {
          setSession(currentSession);
        } else {
          setSession(null);
          resetDashboardState();
          setLoading(false);
        }
      } catch (sessionError) {
        setLoginError(sessionError instanceof Error ? sessionError.message : "No se pudo validar la sesion.");
        setSession(null);
        resetDashboardState();
        setLoading(false);
      } finally {
        setAuthChecking(false);
      }
    };

    void restoreSession();
  }, []);

  useEffect(() => {
    if (session?.authenticated) {
      void loadData(year);
      return;
    }

    setLoading(false);
  }, [session?.authenticated, year]);

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

  const handleLogin = async () => {
    setLoggingIn(true);
    setLoginError(null);

    try {
      const currentSession = await api.login({
        username: loginUsername,
        password: loginPassword
      });

      setSession(currentSession);
      setLoginPassword("");
    } catch (loginFailure) {
      setLoginError(loginFailure instanceof Error ? loginFailure.message : "No se pudo iniciar sesion.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      setSession(null);
      setError(null);
      setLoginError(null);
      setLoginPassword("");
      resetDashboardState();
    }
  };

  if (authChecking) {
    return (
      <main className="auth-shell">
        <div className="loading-state">
          <ProgressSpinner />
        </div>
      </main>
    );
  }

  if (!session?.authenticated) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-card__copy">
            <span className="hero__eyebrow">Acceso protegido</span>
            <h1>Inicia sesion para acceder a tu presupuesto familiar.</h1>
            <p>
              La aplicacion queda protegida por una credencial de acceso separada para cada entorno, sin alterar tus
              datos de negocio.
            </p>
          </div>

          <div className="auth-form">
            <div className="field">
              <label htmlFor="login-username">Usuario</label>
              <input
                id="login-username"
                className="auth-input"
                type="text"
                autoComplete="username"
                value={loginUsername}
                onChange={(event) => setLoginUsername(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="login-password">Contrasena</label>
              <input
                id="login-password"
                className="auth-input"
                type="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleLogin();
                  }
                }}
              />
            </div>

            {loginError ? <Message severity="error" text={loginError} className="page-message" /> : null}

            <Button label="Entrar" onClick={() => void handleLogin()} loading={loggingIn} />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="hero__eyebrow">Presupuesto domestico anual</span>
          <strong>Sesion activa como {session.username}</strong>
        </div>

        <Button text label="Desconectar" onClick={() => void handleLogout()} />
      </header>

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

          <div className="hero__session">
            <span>La sesion caduca automaticamente una semana despues del login.</span>
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
