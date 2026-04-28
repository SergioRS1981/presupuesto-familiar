import { useEffect, useMemo, useState } from "react";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { InputSwitch, InputSwitchChangeEvent } from "primereact/inputswitch";
import { TabPanel, TabView } from "primereact/tabview";
import { api, UnauthorizedError } from "./api/client";
import { AuthSession, Budget, Category, ConfiguredYear, Consumption, Report } from "./api/types";
import { BudgetManager } from "./features/budgets/BudgetManager";
import { ConsumptionManager } from "./features/consumptions/ConsumptionManager";
import { ReportsDashboard } from "./features/reports/ReportsDashboard";
import { formatCurrency } from "./utils/format";

const currentYear = new Date().getFullYear();

export const App = () => {
  const [year, setYear] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState<ConfiguredYear[]>([{ year: currentYear, active: true }]);
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
  const [updatingYearStatus, setUpdatingYearStatus] = useState<number | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const resetDashboardState = () => {
    setCategories([]);
    setBudgets([]);
    setConsumptions([]);
    setReport(null);
    setAvailableYears([{ year: currentYear, active: true }]);
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

  const activeYears = useMemo(
    () => availableYears.filter((configuredYear) => configuredYear.active).map((configuredYear) => configuredYear.year),
    [availableYears]
  );

  const addablePastYears = useMemo(() => {
    const registeredYears = new Set(availableYears.map((configuredYear) => configuredYear.year));
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
      const [loadedCategories, loadedYears] = await Promise.all([
        api.getCategories(),
        api.getYears()
      ]);
      const years = loadedYears.length > 0 ? loadedYears : [{ year: selectedYear, active: true }];
      const activeLoadedYears = years.filter((configuredYear) => configuredYear.active);
      const effectiveYear =
        activeLoadedYears.find((configuredYear) => configuredYear.year === selectedYear)?.year ??
        activeLoadedYears[0]?.year ??
        years[0]?.year ??
        selectedYear;
      const [loadedBudgets, loadedConsumptions, loadedReport] = await Promise.all([
        api.getBudgets(effectiveYear),
        api.getConsumptions(effectiveYear),
        api.getAnnualReport(effectiveYear)
      ]);

      setCategories(loadedCategories);
      setBudgets(loadedBudgets);
      setConsumptions(loadedConsumptions);
      setAvailableYears(
        Array.from(new Map(years.map((configuredYear) => [configuredYear.year, configuredYear])).values()).sort(
          (left, right) => left.year - right.year
        )
      );
      setReport(loadedReport);
      if (effectiveYear !== selectedYear) {
        setYear(effectiveYear);
      }
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
    setYearToCreate(addablePastYears[0] ?? null);
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
        Array.from(new Map([...current, createdYear].map((configuredYear) => [configuredYear.year, configuredYear])).values()).sort(
          (left, right) => left.year - right.year
        )
      );
      setYearDialogVisible(false);
      setYear(createdYear.year);
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : "No se pudo crear el ano solicitado.");
    } finally {
      setCreatingYear(false);
    }
  };

  const handleYearStatusChange = async (selectedYear: number, active: boolean) => {
    setUpdatingYearStatus(selectedYear);
    setError(null);

    try {
      const updatedYear = await api.updateYearStatus(selectedYear, { active });

      setAvailableYears((current) =>
        current
          .map((configuredYear) => (configuredYear.year === updatedYear.year ? updatedYear : configuredYear))
          .sort((left, right) => left.year - right.year)
      );

      if (!active && year === selectedYear) {
        const nextActiveYear = availableYears.find(
          (configuredYear) => configuredYear.year !== selectedYear && configuredYear.active
        )?.year;

        if (nextActiveYear) {
          setYear(nextActiveYear);
        }
      }
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "No se pudo actualizar el estado del ano.");
    } finally {
      setUpdatingYearStatus(null);
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
              options={activeYears.map((value) => ({ label: value.toString(), value }))}
              onChange={(event: DropdownChangeEvent) => setYear(event.value)}
            />
          </div>

          <Button
            icon="pi pi-history"
            label="Gestionar anos"
            outlined
            onClick={openYearDialog}
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
        header="Gestion de anos"
        visible={yearDialogVisible}
        style={{ width: "32rem" }}
        onHide={() => setYearDialogVisible(false)}
        footer={
          <div className="dialog-actions">
            <Button text label="Cancelar" onClick={() => setYearDialogVisible(false)} />
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
          <Button
            label="Anadir ano pasado"
            loading={creatingYear}
            onClick={() => void handleCreateYear()}
            disabled={yearToCreate === null}
          />
          <p className="m-0">
            Al crear el ano podras cargar presupuestos y consumos reales para ese ejercicio aunque todavia no tenga
            datos. Las partidas presupuestarias se comparten automaticamente con el resto de anos.
          </p>
          <div className="field">
            <label>Anos disponibles</label>
            <div className="flex flex-column gap-3">
              {availableYears.map((configuredYear) => {
                const disableDeactivation = configuredYear.active && activeYears.length === 1;

                return (
                  <div key={configuredYear.year} className="flex align-items-center justify-content-between gap-3">
                    <div className="flex flex-column">
                      <strong>{configuredYear.year}</strong>
                      <small>{configuredYear.active ? "Activo en la navegacion" : "Oculto del selector de anos"}</small>
                    </div>
                    <InputSwitch
                      inputId={`year-active-${configuredYear.year}`}
                      checked={configuredYear.active}
                      disabled={updatingYearStatus === configuredYear.year || disableDeactivation}
                      onChange={(event: InputSwitchChangeEvent) =>
                        void handleYearStatusChange(configuredYear.year, Boolean(event.value))
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
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
              availableYears={activeYears}
              onError={setError}
            />
          </TabPanel>
        </TabView>
      )}
    </main>
  );
};
