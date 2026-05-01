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

type ConsumptionFormState = {
  categoryId: string | null;
  month: number;
};

const renderConsumptionMonth = (row: ConsumptionRow) => getMonthName(row.month);

const renderConsumptionKind = (row: ConsumptionRow) => formatKind(row.category.kind);

const renderConsumptionNature = (row: ConsumptionRow) => formatNature(row.category.nature);

const renderConsumptionAmount = (row: ConsumptionRow) => formatCurrency(row.actualAmount);

const renderConsumptionNote = (row: ConsumptionRow) => row.note?.trim() || "Sin nota";

const findFirstAvailableConsumptionSlot = (
  categories: Category[],
  consumptions: Consumption[]
): ConsumptionFormState | null => {
  for (const category of categories) {
    for (const monthOption of monthOptions) {
      const alreadyExists = consumptions.some(
        (consumption) => consumption.categoryId === category.id && consumption.month === monthOption.value
      );

      if (!alreadyExists) {
        return {
          categoryId: category.id,
          month: monthOption.value
        };
      }
    }
  }

  return null;
};

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
  const [partidaFilter, setPartidaFilter] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<number | null>(null);
  const [kindFilter, setKindFilter] = useState<Category["kind"] | null>(null);
  const [natureFilter, setNatureFilter] = useState<Category["nature"] | null>(null);
  const [editingConsumptionId, setEditingConsumptionId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categories[0]?.id ?? null);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [actualAmount, setActualAmount] = useState<number>(0);
  const [note, setNote] = useState("");

  const firstAvailableConsumptionSlot = useMemo(
    () => findFirstAvailableConsumptionSlot(categories, consumptions),
    [categories, consumptions]
  );

  const duplicateConsumption = useMemo(
    () =>
      consumptions.find(
        (consumption) =>
          consumption.categoryId === selectedCategoryId &&
          consumption.month === selectedMonth &&
          consumption.id !== editingConsumptionId
      ) ?? null,
    [consumptions, editingConsumptionId, selectedCategoryId, selectedMonth]
  );

  const isNewConsumptionDisabled = categories.length === 0 || firstAvailableConsumptionSlot === null;

  const totalActual = useMemo(
    () => consumptions.reduce((accumulator, item) => accumulator + Number(item.actualAmount), 0),
    [consumptions]
  );

  const openDialog = (consumption?: Consumption) => {
    if (!consumption && !firstAvailableConsumptionSlot) {
      setFeedback({
        severity: "error",
        text: "Ya existe un consumo para cada partida y mes disponibles. Usa Editar para modificar uno ya registrado."
      });
      return;
    }

    setEditingConsumptionId(consumption?.id ?? null);
    setSelectedCategoryId(consumption?.categoryId ?? firstAvailableConsumptionSlot?.categoryId ?? categories[0]?.id ?? null);
    setSelectedMonth(consumption?.month ?? firstAvailableConsumptionSlot?.month ?? 1);
    setActualAmount(Number(consumption?.actualAmount ?? 0));
    setNote(consumption?.note ?? "");
    setFeedback(null);
    setDialogVisible(true);
  };

  const saveConsumption = async () => {
    if (!selectedCategoryId) {
      return;
    }

    if (duplicateConsumption) {
      setFeedback({
        severity: "error",
        text: "Ya existe un consumo para esa partida y mes. Debes modificarlo desde la accion Editar de la tabla."
      });
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

  const filteredConsumptionRows = useMemo(
    () =>
      consumptionRows.filter((consumption) => {
        if (partidaFilter && consumption.categoryId !== partidaFilter) {
          return false;
        }

        if (monthFilter && consumption.month !== monthFilter) {
          return false;
        }

        if (kindFilter && consumption.category.kind !== kindFilter) {
          return false;
        }

        if (natureFilter && consumption.category.nature !== natureFilter) {
          return false;
        }

        return true;
      }),
    [consumptionRows, kindFilter, monthFilter, natureFilter, partidaFilter]
  );

  const hasActiveFilters = Boolean(partidaFilter || monthFilter || kindFilter || natureFilter);

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
        <Button label="Nuevo consumo" icon="pi pi-plus" onClick={() => openDialog()} disabled={isNewConsumptionDisabled} />
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
        El fichero debe incluir ano, mes, partida e importe real. La partida debe existir previamente. Si un consumo ya
        existe para una partida y mes concretos, debes actualizarlo desde Editar.
      </p>
      {feedback ? <div className={`inline-feedback inline-feedback--${feedback.severity}`}>{feedback.text}</div> : null}

      <div className="table-filters">
        <div className="field">
          <label htmlFor="consumption-filter-category">Filtrar por partida</label>
          <Dropdown
            id="consumption-filter-category"
            value={partidaFilter}
            options={categories.map((category) => ({
              label: category.name,
              value: category.id
            }))}
            onChange={(event: DropdownChangeEvent) => setPartidaFilter(event.value || null)}
            placeholder="Todas las partidas"
          />
        </div>
        <div className="field">
          <label htmlFor="consumption-filter-month">Filtrar por mes</label>
          <Dropdown
            id="consumption-filter-month"
            value={monthFilter}
            options={monthOptions}
            onChange={(event: DropdownChangeEvent) => setMonthFilter(event.value || null)}
            placeholder="Todos los meses"
          />
        </div>
        <div className="field">
          <label htmlFor="consumption-filter-kind">Filtrar por tipo</label>
          <Dropdown
            id="consumption-filter-kind"
            value={kindFilter}
            options={[
              { label: formatKind("INCOME"), value: "INCOME" },
              { label: formatKind("EXPENSE"), value: "EXPENSE" }
            ]}
            onChange={(event: DropdownChangeEvent) => setKindFilter(event.value || null)}
            placeholder="Todos los tipos"
          />
        </div>
        <div className="field">
          <label htmlFor="consumption-filter-nature">Filtrar por naturaleza</label>
          <Dropdown
            id="consumption-filter-nature"
            value={natureFilter}
            options={[
              { label: formatNature("FIXED"), value: "FIXED" },
              { label: formatNature("VARIABLE"), value: "VARIABLE" }
            ]}
            onChange={(event: DropdownChangeEvent) => setNatureFilter(event.value || null)}
            placeholder="Todas las naturalezas"
          />
        </div>
      </div>
      {hasActiveFilters ? (
        <div className="panel-actions panel-actions--start">
          <Button
            text
            label="Limpiar filtros"
            icon="pi pi-filter-slash"
            onClick={() => {
              setPartidaFilter(null);
              setMonthFilter(null);
              setKindFilter(null);
              setNatureFilter(null);
            }}
          />
        </div>
      ) : null}

      <DataTable
        value={filteredConsumptionRows}
        size="small"
        paginator
        rows={10}
        emptyMessage="No hay consumos registrados."
        className="consumption-table"
      >
        <Column field="category.name" header="Partida" sortable />
        <Column field="month" header="Mes" body={renderConsumptionMonth} sortable />
        <Column field="category.kind" header="Tipo" body={renderConsumptionKind} sortable />
        <Column field="category.nature" header="Naturaleza" body={renderConsumptionNature} sortable />
        <Column field="actualAmount" header="Importe real" body={renderConsumptionAmount} sortable />
        <Column field="note" header="Nota" body={renderConsumptionNote} />
        <Column header="Acciones" body={renderConsumptionActions} />
      </DataTable>

      <Dialog
        header={`${editingConsumptionId ? "Editar" : "Nuevo"} consumo mensual ${year}`}
        visible={dialogVisible}
        style={{ width: "30rem" }}
        onHide={() => {
          setDialogVisible(false);
          setEditingConsumptionId(null);
        }}
        footer={
          <div className="dialog-actions">
            <Button text label="Cancelar" onClick={() => setDialogVisible(false)} />
            <Button label="Guardar" loading={saving} onClick={saveConsumption} disabled={!selectedCategoryId || !!duplicateConsumption} />
          </div>
        }
      >
        {duplicateConsumption ? (
          <div className="inline-feedback inline-feedback--error">
            Ya existe un consumo para esa partida y mes. Debes modificarlo desde la accion Editar de la tabla.
          </div>
        ) : null}
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
