import { useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { InputNumber, InputNumberValueChangeEvent } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { api } from "../../api/client";
import { Category, Consumption } from "../../api/types";
import { formatCurrency, formatKind, formatNature } from "../../utils/format";
import { getMonthName, monthOptions } from "../../utils/months";
import { ExcelTransferActions } from "../imports/ExcelTransferActions";
import {
  downloadConsumptionTemplateWorkbook,
  getCategoryLookupKey,
  readConsumptionImportFile
} from "../imports/excel-import";

type ConsumptionManagerProps = {
  year: number;
  categories: Category[];
  consumptions: Consumption[];
  onReload: () => Promise<void>;
};

type Feedback = {
  severity: "success" | "error";
  text: string;
};

type ConsumptionRow = Consumption & {
  onEdit: () => void;
  onDelete: () => void;
};

const renderConsumptionMonth = (row: ConsumptionRow) => getMonthName(row.month);

const renderConsumptionKind = (row: ConsumptionRow) => formatKind(row.category.kind);

const renderConsumptionNature = (row: ConsumptionRow) => formatNature(row.category.nature);

const renderConsumptionAmount = (row: ConsumptionRow) => formatCurrency(row.actualAmount);

const renderConsumptionNote = (row: ConsumptionRow) => row.note?.trim() || "Sin nota";

const renderConsumptionActions = (row: ConsumptionRow) => (
  <div className="table-actions">
    <Button text rounded icon="pi pi-pencil" onClick={row.onEdit} />
    <Button text rounded severity="danger" icon="pi pi-trash" onClick={row.onDelete} />
  </div>
);

export const ConsumptionManager = ({ year, categories, consumptions, onReload }: ConsumptionManagerProps) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categories[0]?.id ?? null);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [actualAmount, setActualAmount] = useState<number>(0);
  const [note, setNote] = useState("");

  const totalActual = useMemo(
    () => consumptions.reduce((accumulator, item) => accumulator + Number(item.actualAmount), 0),
    [consumptions]
  );

  const openDialog = (consumption?: Consumption) => {
    setSelectedCategoryId(consumption?.categoryId ?? categories[0]?.id ?? null);
    setSelectedMonth(consumption?.month ?? 1);
    setActualAmount(Number(consumption?.actualAmount ?? 0));
    setNote(consumption?.note ?? "");
    setDialogVisible(true);
  };

  const saveConsumption = async () => {
    if (!selectedCategoryId) {
      return;
    }

    setFeedback(null);
    setSaving(true);

    try {
      await api.saveConsumption({
        year,
        categoryId: selectedCategoryId,
        month: selectedMonth,
        actualAmount,
        note
      });

      setDialogVisible(false);
      await onReload();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConsumption = async (consumption: Consumption) => {
    if (!window.confirm("Se eliminara este consumo mensual.")) {
      return;
    }

    setFeedback(null);
    await api.deleteConsumption(consumption.id);
    await onReload();
  };

  const handleDownloadTemplate = async () => {
    await downloadConsumptionTemplateWorkbook({ year, categories });
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setFeedback(null);

    try {
      const rows = await readConsumptionImportFile(file, year);
      const categoryMap = new Map(categories.map((category) => [getCategoryLookupKey(category.name), category]));

      for (const row of rows) {
        const category = categoryMap.get(getCategoryLookupKey(row.categoryName));

        if (!category) {
          throw new Error(`La partida "${row.categoryName}" no existe. Importa o crea antes esa partida.`);
        }

        await api.saveConsumption({
          year: row.year,
          month: row.month,
          categoryId: category.id,
          actualAmount: row.actualAmount,
          note: null
        });
      }

      await onReload();
      setFeedback({
        severity: "success",
        text: `Importacion completada. Consumos actualizados: ${rows.length}.`
      });
    } catch (error) {
      setFeedback({
        severity: "error",
        text: error instanceof Error ? error.message : "No se pudo importar el Excel de consumos."
      });
    } finally {
      setImporting(false);
    }
  };

  const consumptionRows = useMemo<ConsumptionRow[]>(
    () =>
      consumptions.map((consumption) => ({
        ...consumption,
        onEdit: () => openDialog(consumption),
        onDelete: () => {
          void handleDeleteConsumption(consumption);
        }
      })),
    [consumptions]
  );

  return (
    <Card
      title={`Consumos reales ${year}`}
      subTitle="Registra el uso real mensual de cada partida presupuestaria."
      className="panel-card"
    >
      <div className="panel-actions panel-actions--between">
        <div className="consumption-highlight">
          <span className="consumption-highlight__label">Total registrado</span>
          <strong>{formatCurrency(totalActual)}</strong>
        </div>
        <Button label="Nuevo consumo" icon="pi pi-plus" onClick={() => openDialog()} disabled={categories.length === 0} />
      </div>
      <ExcelTransferActions
        inputId="consumption-import-file"
        downloadLabel="Descargar ejemplo Excel"
        importLabel="Importar Excel consumos"
        importDisabled={categories.length === 0}
        importLoading={importing}
        onDownload={handleDownloadTemplate}
        onImport={handleImport}
      />
      <p className="panel-note">
        El fichero debe incluir ano, mes, partida e importe real. La partida debe existir previamente.
      </p>
      {feedback ? <div className={`inline-feedback inline-feedback--${feedback.severity}`}>{feedback.text}</div> : null}

      <DataTable value={consumptionRows} size="small" paginator rows={10} emptyMessage="No hay consumos registrados.">
        <Column field="category.name" header="Partida" />
        <Column field="month" header="Mes" body={renderConsumptionMonth} />
        <Column field="category.kind" header="Tipo" body={renderConsumptionKind} />
        <Column field="category.nature" header="Naturaleza" body={renderConsumptionNature} />
        <Column field="actualAmount" header="Importe real" body={renderConsumptionAmount} />
        <Column field="note" header="Nota" body={renderConsumptionNote} />
        <Column header="Acciones" body={renderConsumptionActions} />
      </DataTable>

      <Dialog
        header={`Consumo mensual ${year}`}
        visible={dialogVisible}
        style={{ width: "30rem" }}
        onHide={() => setDialogVisible(false)}
        footer={
          <div className="dialog-actions">
            <Button text label="Cancelar" onClick={() => setDialogVisible(false)} />
            <Button label="Guardar" loading={saving} onClick={saveConsumption} />
          </div>
        }
      >
        <div className="form-grid">
          <div className="field">
            <label htmlFor="consumption-category">Partida</label>
            <Dropdown
              id="consumption-category"
              value={selectedCategoryId}
              options={categories.map((category) => ({
                label: `${category.name} · ${formatKind(category.kind)} · ${formatNature(category.nature)}`,
                value: category.id
              }))}
              onChange={(event: DropdownChangeEvent) => setSelectedCategoryId(event.value)}
              placeholder="Selecciona una partida"
            />
          </div>
          <div className="field">
            <label htmlFor="consumption-month">Mes</label>
            <Dropdown
              id="consumption-month"
              value={selectedMonth}
              options={monthOptions}
              onChange={(event: DropdownChangeEvent) => setSelectedMonth(event.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="consumption-amount">Importe real</label>
            <InputNumber
              inputId="consumption-amount"
              value={actualAmount}
              onValueChange={(event: InputNumberValueChangeEvent) => setActualAmount(event.value ?? 0)}
              mode="currency"
              currency="EUR"
              locale="es-ES"
              min={0}
            />
          </div>
          <div className="field">
            <label htmlFor="consumption-note">Nota opcional</label>
            <InputText
              id="consumption-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>
      </Dialog>
    </Card>
  );
};
