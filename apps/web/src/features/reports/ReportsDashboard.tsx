import "chart.js/auto";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Tag } from "primereact/tag";
import { Report } from "../../api/types";
import { SummaryCard } from "../../components/SummaryCard";
import { formatCurrency, formatKind, formatNature } from "../../utils/format";
import { getMonthName } from "../../utils/months";

type ReportsDashboardProps = {
  report: Report | null;
  year: number;
};

type NatureComparisonRow = Report["byNatureComparison"][number];
type KindComparisonRow = Report["annualBreakdown"]["byKind"][number];
type MonthlyRow = Report["monthlyLinearComparison"][number];
type ItemRow = Report["byItemComparison"][number];

const renderNatureComparisonName = (row: NatureComparisonRow) => formatNature(row.nature);

const renderNatureComparisonPlanned = (row: NatureComparisonRow) => formatCurrency(row.plannedAmount);

const renderNatureComparisonActual = (row: NatureComparisonRow) => formatCurrency(row.actualAmount);

const renderNatureComparisonDifference = (row: NatureComparisonRow) => formatCurrency(row.difference);

const renderKindComparisonName = (row: KindComparisonRow) => formatKind(row.kind);

const renderKindComparisonPlanned = (row: KindComparisonRow) => formatCurrency(row.plannedAmount);

const renderKindComparisonActual = (row: KindComparisonRow) => formatCurrency(row.actualAmount);

const renderKindComparisonDifference = (row: KindComparisonRow) => formatCurrency(row.difference);

const renderMonthlyName = (row: MonthlyRow) => getMonthName(row.month);

const renderMonthlyPlanned = (row: MonthlyRow) => formatCurrency(row.plannedAmount);

const renderMonthlyActual = (row: MonthlyRow) => formatCurrency(row.actualAmount);

const renderMonthlyDifference = (row: MonthlyRow) => formatCurrency(row.difference);

const renderMonthlyCumulativeDifference = (row: MonthlyRow) => formatCurrency(row.cumulativeDifference);

const renderItemKind = (row: ItemRow) => (
  <Tag value={formatKind(row.kind)} severity={row.kind === "INCOME" ? "success" : "danger"} />
);

const renderItemNature = (row: ItemRow) => formatNature(row.nature);

const renderItemPlanned = (row: ItemRow) => formatCurrency(row.plannedAmount);

const renderItemActual = (row: ItemRow) => formatCurrency(row.actualAmount);

const renderItemDifference = (row: ItemRow) => formatCurrency(row.difference);

const renderItemConsumedPercentage = (row: ItemRow) => `${row.consumedPercentage.toFixed(2)}%`;

export const ReportsDashboard = ({ report, year }: ReportsDashboardProps) => {
  if (!report) {
    return (
      <Card title={`Informes ${year}`} className="panel-card">
        Todavia no hay datos para generar informes del ano seleccionado.
      </Card>
    );
  }

  const monthlyChartData = {
    labels: report.monthlyLinearComparison.map((item) => getMonthName(item.month)),
    datasets: [
      {
        label: "Previsto linealizado",
        data: report.monthlyLinearComparison.map((item) => item.plannedAmount),
        borderColor: "#0f766e",
        backgroundColor: "rgba(15, 118, 110, 0.18)",
        tension: 0.35
      },
      {
        label: "Real consumido",
        data: report.monthlyLinearComparison.map((item) => item.actualAmount),
        borderColor: "#c2410c",
        backgroundColor: "rgba(194, 65, 12, 0.18)",
        tension: 0.35
      }
    ]
  };

  return (
    <div className="reports-layout">
      <div className="grid">
        <div className="col-12 md:col-6 xl:col-3">
          <SummaryCard
            title="Ingresos previstos"
            value={formatCurrency(report.totals.plannedIncome)}
            caption="Total anual presupuestado de ingresos."
            accentClassName="summary-card--income"
            icon={<i className="pi pi-arrow-down-left" />}
          />
        </div>
        <div className="col-12 md:col-6 xl:col-3">
          <SummaryCard
            title="Gastos previstos"
            value={formatCurrency(report.totals.plannedExpense)}
            caption="Total anual presupuestado de gastos."
            accentClassName="summary-card--expense"
            icon={<i className="pi pi-arrow-up-right" />}
          />
        </div>
        <div className="col-12 md:col-6 xl:col-3">
          <SummaryCard
            title="Balance previsto"
            value={formatCurrency(report.totals.plannedBalance)}
            caption="Diferencia entre ingresos y gastos previstos."
            accentClassName="summary-card--balance"
            icon={<i className="pi pi-chart-line" />}
          />
        </div>
        <div className="col-12 md:col-6 xl:col-3">
          <SummaryCard
            title="Balance real"
            value={formatCurrency(report.totals.actualBalance)}
            caption="Saldo real consumido y registrado hasta ahora."
            accentClassName="summary-card--actual"
            icon={<i className="pi pi-wallet" />}
          />
        </div>
      </div>

      <div className="grid">
        <div className="col-12 xl:col-7">
          <Card
            title="Comparativa mensual linealizada"
            subTitle="Presupuesto previsto por mes frente al consumo real."
            className="panel-card"
          >
            <Chart type="line" data={monthlyChartData} />
          </Card>
        </div>
        <div className="col-12 xl:col-5">
          <Card
            title="Comparativa por naturaleza"
            subTitle="Fijo y variable, previsto vs real."
            className="panel-card"
          >
            <DataTable value={report.byNatureComparison} size="small">
              <Column field="nature" header="Naturaleza" body={renderNatureComparisonName} />
              <Column field="plannedAmount" header="Previsto" body={renderNatureComparisonPlanned} />
              <Column field="actualAmount" header="Real" body={renderNatureComparisonActual} />
              <Column field="difference" header="Diferencia" body={renderNatureComparisonDifference} />
            </DataTable>
          </Card>
        </div>
      </div>

      <div className="grid">
        <div className="col-12 xl:col-6">
          <Card
            title="Previsto y acumulado por tipo"
            subTitle="Ingresos y gastos del ano seleccionado."
            className="panel-card"
          >
            <DataTable value={report.annualBreakdown.byKind} size="small">
              <Column field="kind" header="Tipo" body={renderKindComparisonName} />
              <Column field="plannedAmount" header="Previsto" body={renderKindComparisonPlanned} />
              <Column field="actualAmount" header="Acumulado real" body={renderKindComparisonActual} />
              <Column field="difference" header="Diferencia" body={renderKindComparisonDifference} />
            </DataTable>
          </Card>
        </div>
        <div className="col-12 xl:col-6">
          <Card
            title="Comparativa mensual detallada"
            subTitle="Incluye acumulado linealizado y acumulado real."
            className="panel-card"
          >
            <DataTable value={report.monthlyLinearComparison} size="small" paginator rows={6}>
              <Column field="month" header="Mes" body={renderMonthlyName} />
              <Column field="plannedAmount" header="Previsto" body={renderMonthlyPlanned} />
              <Column field="actualAmount" header="Real" body={renderMonthlyActual} />
              <Column field="difference" header="Diferencia" body={renderMonthlyDifference} />
              <Column field="cumulativeDifference" header="Dif. acum." body={renderMonthlyCumulativeDifference} />
            </DataTable>
          </Card>
        </div>
      </div>

      <Card
        title="Comparativa por partida"
        subTitle="Presupuesto anual total por partida frente al real consumido y porcentaje ejecutado."
        className="panel-card"
      >
        <DataTable value={report.byItemComparison} size="small" paginator rows={10}>
          <Column field="categoryName" header="Partida" />
          <Column field="kind" header="Tipo" body={renderItemKind} />
          <Column field="nature" header="Naturaleza" body={renderItemNature} />
          <Column field="plannedAmount" header="Previsto" body={renderItemPlanned} />
          <Column field="actualAmount" header="Real" body={renderItemActual} />
          <Column field="difference" header="Diferencia" body={renderItemDifference} />
          <Column field="consumedPercentage" header="% consumido" body={renderItemConsumedPercentage} />
        </DataTable>
      </Card>
    </div>
  );
};
