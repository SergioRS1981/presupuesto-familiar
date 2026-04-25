import { Budget, Consumption, Report } from "../../api/types";
import { getMonthName } from "../../utils/months";

export type ComparisonRow = {
  label: string;
  plannedAmount: number;
  actualAmount: number;
  differenceAmount: number;
  executionRatio: number | null;
};

const csvSeparator = ";";

const formatCsvNumber = (value: number) =>
  new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

const formatCsvPercentage = (value: number | null) =>
  value === null
    ? "Sin previsto"
    : new Intl.NumberFormat("es-ES", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(value);

const escapeCsvValue = (value: string) => `"${value.replaceAll('"', '""')}"`;

const createCsvLine = (values: Array<string | number>) =>
  values
    .map((value) => {
      if (typeof value === "number") {
        return escapeCsvValue(formatCsvNumber(value));
      }

      return escapeCsvValue(value);
    })
    .join(csvSeparator);

export const calculateExecutionRatio = (plannedAmount: number, actualAmount: number) => {
  if (plannedAmount === 0) {
    return actualAmount === 0 ? 0 : null;
  }

  return actualAmount / plannedAmount;
};

export const buildComparisonRow = (label: string, plannedAmount: number, actualAmount: number): ComparisonRow => ({
  label,
  plannedAmount,
  actualAmount,
  differenceAmount: actualAmount - plannedAmount,
  executionRatio: calculateExecutionRatio(plannedAmount, actualAmount)
});

export const buildSummaryRows = (report: Report): ComparisonRow[] => [
  buildComparisonRow("Ingresos fijos", report.planned.incomeFixed, report.actual.incomeFixed),
  buildComparisonRow("Ingresos variables", report.planned.incomeVariable, report.actual.incomeVariable),
  buildComparisonRow("Total ingresos", report.planned.incomeTotal, report.actual.incomeTotal),
  buildComparisonRow("Gastos fijos", report.planned.expenseFixed, report.actual.expenseFixed),
  buildComparisonRow("Gastos variables", report.planned.expenseVariable, report.actual.expenseVariable),
  buildComparisonRow("Total gastos", report.planned.expenseTotal, report.actual.expenseTotal),
  buildComparisonRow("Balance", report.planned.balance, report.actual.balance)
];

export const buildCategoryRows = (budgets: Budget[], consumptions: Consumption[]): ComparisonRow[] => {
  const categoryMap = new Map<
    string,
    {
      label: string;
      plannedAmount: number;
      actualAmount: number;
    }
  >();

  budgets.forEach((budget) => {
    const current = categoryMap.get(budget.categoryId) ?? {
      label: budget.category.name,
      plannedAmount: 0,
      actualAmount: 0
    };

    current.label = budget.category.name;
    current.plannedAmount += Number(budget.plannedAmount);
    categoryMap.set(budget.categoryId, current);
  });

  consumptions.forEach((consumption) => {
    const current = categoryMap.get(consumption.categoryId) ?? {
      label: consumption.category.name,
      plannedAmount: 0,
      actualAmount: 0
    };

    current.label = consumption.category.name;
    current.actualAmount += Number(consumption.actualAmount);
    categoryMap.set(consumption.categoryId, current);
  });

  return Array.from(categoryMap.values())
    .sort((left, right) => left.label.localeCompare(right.label, "es"))
    .map((row) => buildComparisonRow(row.label, row.plannedAmount, row.actualAmount));
};

export const buildReportCsv = ({
  budgets,
  consumptions,
  report,
  year
}: {
  year: number;
  report: Report;
  budgets: Budget[];
  consumptions: Consumption[];
}) => {
  const summaryRows = buildSummaryRows(report);
  const categoryRows = buildCategoryRows(budgets, consumptions);

  const lines = [
    createCsvLine([`Informe anual ${year}`]),
    "",
    createCsvLine(["Resumen anual"]),
    createCsvLine(["Concepto", "Previsto", "Real", "Diferencia", "% real sobre previsto"]),
    ...summaryRows.map((row) =>
      createCsvLine([
        row.label,
        row.plannedAmount,
        row.actualAmount,
        row.differenceAmount,
        formatCsvPercentage(row.executionRatio)
      ])
    ),
    "",
    createCsvLine(["Detalle mensual real"]),
    createCsvLine(["Mes", "Gastos fijos", "Gastos variables", "Gastos totales", "Ingresos totales", "Balance"]),
    ...report.monthlyActual.map((row) =>
      createCsvLine([
        getMonthName(row.month),
        row.expenseFixed,
        row.expenseVariable,
        row.expenseTotal,
        row.incomeTotal,
        row.balance
      ])
    ),
    "",
    createCsvLine(["Detalle por partida"]),
    createCsvLine(["Partida", "Previsto", "Real", "Diferencia", "% real sobre previsto"]),
    ...categoryRows.map((row) =>
      createCsvLine([
        row.label,
        row.plannedAmount,
        row.actualAmount,
        row.differenceAmount,
        formatCsvPercentage(row.executionRatio)
      ])
    )
  ];

  return `\uFEFF${lines.join("\n")}`;
};

export const buildYearTotalsCsv = (reports: Report[]) => {
  const orderedReports = [...reports].sort((left, right) => left.year - right.year);

  const lines = [
    createCsvLine(["Totales anuales"]),
    "",
    createCsvLine([
      "Ano",
      "Ingresos fijos previstos",
      "Ingresos fijos reales",
      "Ingresos variables previstos",
      "Ingresos variables reales",
      "Gastos fijos previstos",
      "Gastos fijos reales",
      "Gastos variables previstos",
      "Gastos variables reales",
      "Total ingresos previsto",
      "Total ingresos real",
      "Total gastos previsto",
      "Total gastos real",
      "Balance previsto",
      "Balance real"
    ]),
    ...orderedReports.map((report) =>
      createCsvLine([
        `${report.year}`,
        report.planned.incomeFixed,
        report.actual.incomeFixed,
        report.planned.incomeVariable,
        report.actual.incomeVariable,
        report.planned.expenseFixed,
        report.actual.expenseFixed,
        report.planned.expenseVariable,
        report.actual.expenseVariable,
        report.planned.incomeTotal,
        report.actual.incomeTotal,
        report.planned.expenseTotal,
        report.actual.expenseTotal,
        report.planned.balance,
        report.actual.balance
      ])
    )
  ];

  return `\uFEFF${lines.join("\n")}`;
};

export const downloadCsvFile = (content: string, filename: string) => {
  const file = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
