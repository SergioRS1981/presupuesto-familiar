import { useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Budget, Consumption, MonthlyReportRow, Report } from "../../api/types";
import { api } from "../../api/client";
import { formatCurrency, formatPercentage } from "../../utils/format";
import { getMonthName } from "../../utils/months";
import {
  ComparisonRow,
  buildCategoryRows,
  buildReportCsv,
  buildSummaryRows,
  buildYearTotalsCsv,
  downloadCsvFile
} from "./report-export";

type ReportsDashboardProps = {
  availableYears: number[];
  report: Report | null;
  budgets: Budget[];
  consumptions: Consumption[];
  onError?: (message: string) => void;
  year: number;
};

const renderLabel = (row: ComparisonRow) => row.label;

const renderPlannedAmount = (row: ComparisonRow) => formatCurrency(row.plannedAmount);

const renderActualAmount = (row: ComparisonRow) => formatCurrency(row.actualAmount);

const renderDifference = (row: ComparisonRow) => {
  const executionLabel =
    row.executionRatio === null ? "Sin previsto" : formatPercentage(row.executionRatio);

  return `${formatCurrency(row.differenceAmount)} (${executionLabel})`;
};

const renderMonthName = (row: MonthlyReportRow) => getMonthName(row.month);

const renderMonthlyExpenseFixed = (row: MonthlyReportRow) => formatCurrency(row.expenseFixed);

const renderMonthlyExpenseVariable = (row: MonthlyReportRow) => formatCurrency(row.expenseVariable);

const renderMonthlyExpenseTotal = (row: MonthlyReportRow) => formatCurrency(row.expenseTotal);

const renderMonthlyIncomeTotal = (row: MonthlyReportRow) => formatCurrency(row.incomeTotal);

const renderMonthlyBalance = (row: MonthlyReportRow) => formatCurrency(row.balance);

export const ReportsDashboard = ({
  availableYears,
  report,
  budgets,
  consumptions,
  onError,
  year
}: ReportsDashboardProps) => {
  const [exportingCurrent, setExportingCurrent] = useState(false);
  const [exportingTotals, setExportingTotals] = useState(false);

  if (!report) {
    return (
      <Card title={`Informes ${year}`} className="panel-card">
        Todavia no hay datos para generar informes del ano seleccionado.
      </Card>
    );
  }

  const handleExportCurrentYear = () => {
    try {
      setExportingCurrent(true);
      const csv = buildReportCsv({ year, report, budgets, consumptions });
      downloadCsvFile(csv, `informes-${year}.csv`);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "No se pudo generar el CSV del informe.");
    } finally {
      setExportingCurrent(false);
    }
  };

  const handleExportYearTotals = async () => {
    try {
      setExportingTotals(true);
      const reports = await Promise.all(availableYears.map((value) => api.getAnnualReport(value)));
      const csv = buildYearTotalsCsv(reports);
      downloadCsvFile(csv, "totales-anuales.csv");
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "No se pudo generar el CSV de totales anuales.");
    } finally {
      setExportingTotals(false);
    }
  };

  return (
    <Card
      title={`Informes ${year}`}
      subTitle="Resumen del ejercicio con ingresos y gastos previstos y reales, separados por naturaleza."
      className="panel-card"
    >
      <div className="flex flex-column gap-4">
        <div className="flex flex-wrap gap-2 justify-content-end">
          <Button
            label={`Descargar informe ${year}`}
            icon="pi pi-download"
            outlined
            loading={exportingCurrent}
            onClick={handleExportCurrentYear}
          />
          <Button
            label="Descargar totales anuales"
            icon="pi pi-file-export"
            outlined
            loading={exportingTotals}
            onClick={() => void handleExportYearTotals()}
          />
        </div>

        <DataTable value={buildSummaryRows(report)} size="small">
          <Column field="label" header="Concepto" body={renderLabel} />
          <Column field="plannedAmount" header="Previsto" body={renderPlannedAmount} />
          <Column field="actualAmount" header="Real" body={renderActualAmount} />
          <Column field="differenceAmount" header="Diferencia" body={renderDifference} />
        </DataTable>

        <DataTable value={report.monthlyActual} size="small">
          <Column field="month" header="Mes" body={renderMonthName} />
          <Column field="expenseFixed" header="Gastos fijos" body={renderMonthlyExpenseFixed} />
          <Column field="expenseVariable" header="Gastos variables" body={renderMonthlyExpenseVariable} />
          <Column field="expenseTotal" header="Gastos totales" body={renderMonthlyExpenseTotal} />
          <Column field="incomeTotal" header="Ingresos totales" body={renderMonthlyIncomeTotal} />
          <Column field="balance" header="Balance" body={renderMonthlyBalance} />
        </DataTable>

        <DataTable value={buildCategoryRows(budgets, consumptions)} size="small" emptyMessage="No hay partidas con datos para este ano.">
          <Column field="label" header="Partida" body={renderLabel} />
          <Column field="plannedAmount" header="Previsto" body={renderPlannedAmount} />
          <Column field="actualAmount" header="Real" body={renderActualAmount} />
          <Column field="differenceAmount" header="Diferencia" body={renderDifference} />
        </DataTable>
      </div>
    </Card>
  );
};
