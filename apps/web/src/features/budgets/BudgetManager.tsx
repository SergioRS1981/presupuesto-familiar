import { ChangeEvent, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { InputNumber, InputNumberValueChangeEvent } from "primereact/inputnumber";
import { InputSwitch, InputSwitchChangeEvent } from "primereact/inputswitch";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { api } from "../../api/client";
import { Budget, Category } from "../../api/types";
import { formatCurrency, formatKind, formatNature } from "../../utils/format";
import { ExcelTransferActions } from "../imports/ExcelTransferActions";
import {
  downloadBudgetTemplateWorkbook,
  downloadCategoryTemplateWorkbook,
  getCategoryLookupKey,
  readBudgetImportFile,
  readCategoryImportFile
} from "../imports/excel-import";

type BudgetManagerProps = {
  year: number;
  categories: Category[];
  budgets: Budget[];
  onReload: () => Promise<void>;
};

type BudgetRow = {
  id: string;
  category: Category;
  plannedAmount: number;
  budgetId?: string;
  onEdit: () => void;
  onDelete?: () => void;
};

type CategoryRow = Category & {
  onEdit: () => void;
  onDelete: () => void;
};

type CategoryForm = {
  name: string;
  description: string;
  kind: "INCOME" | "EXPENSE";
  nature: "FIXED" | "VARIABLE";
  active: boolean;
};

type Feedback = {
  severity: "success" | "error";
  text: string;
};

const kindOptions = [
  { label: "Ingreso", value: "INCOME" },
  { label: "Gasto", value: "EXPENSE" }
];

const natureOptions = [
  { label: "Fija", value: "FIXED" },
  { label: "Variable", value: "VARIABLE" }
];

const emptyCategory: CategoryForm = {
  name: "",
  description: "",
  kind: "EXPENSE",
  nature: "FIXED",
  active: true
};

const renderCategoryKind = (row: CategoryRow) => (
  <Tag value={formatKind(row.kind)} severity={row.kind === "INCOME" ? "success" : "danger"} />
);

const renderCategoryNature = (row: CategoryRow) => formatNature(row.nature);

const renderCategoryStatus = (row: CategoryRow) => (row.active ? "Activa" : "Inactiva");

const renderCategoryActions = (row: CategoryRow) => (
  <div className="table-actions">
    <Button text rounded icon="pi pi-pencil" onClick={row.onEdit} />
    <Button text rounded severity="danger" icon="pi pi-trash" onClick={row.onDelete} />
  </div>
);

const renderBudgetKind = (row: BudgetRow) => formatKind(row.category.kind);

const renderBudgetNature = (row: BudgetRow) => formatNature(row.category.nature);

const renderBudgetAmount = (row: BudgetRow) => formatCurrency(row.plannedAmount);

const renderBudgetActions = (row: BudgetRow) => (
  <div className="table-actions">
    <Button text rounded icon="pi pi-pencil" onClick={row.onEdit} />
    {row.onDelete ? <Button text rounded severity="danger" icon="pi pi-trash" onClick={row.onDelete} /> : null}
  </div>
);

export const BudgetManager = ({ year, categories, budgets, onReload }: BudgetManagerProps) => {
  const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);
  const [budgetDialogVisible, setBudgetDialogVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importingCategories, setImportingCategories] = useState(false);
  const [importingBudgets, setImportingBudgets] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [plannedAmount, setPlannedAmount] = useState<number>(0);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory);

  const openCategoryDialog = (category?: Category) => {
    setEditingCategory(category ?? null);
    setCategoryForm(
      category
        ? {
            name: category.name,
            description: category.description ?? "",
            kind: category.kind,
            nature: category.nature,
            active: category.active
          }
        : emptyCategory
    );
    setCategoryDialogVisible(true);
  };

  const openBudgetDialog = (categoryId?: string, amount?: number) => {
    setSelectedCategoryId(categoryId ?? categories[0]?.id ?? null);
    setPlannedAmount(amount ?? 0);
    setBudgetDialogVisible(true);
  };

  const saveCategory = async () => {
    setFeedback(null);
    setSaving(true);

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, categoryForm);
      } else {
        await api.createCategory(categoryForm);
      }

      setCategoryDialogVisible(false);
      await onReload();
    } finally {
      setSaving(false);
    }
  };

  const saveBudget = async () => {
    if (!selectedCategoryId) {
      return;
    }

    setFeedback(null);
    setSaving(true);

    try {
      await api.saveBudget({
        year,
        categoryId: selectedCategoryId,
        plannedAmount
      });

      setBudgetDialogVisible(false);
      await onReload();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Se eliminara la partida "${category.name}".`)) {
      return;
    }

    setFeedback(null);
    await api.deleteCategory(category.id);
    await onReload();
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!window.confirm("Se eliminara el presupuesto anual de esta partida.")) {
      return;
    }

    setFeedback(null);
    await api.deleteBudget(budgetId);
    await onReload();
  };

  const handleDownloadCategoryTemplate = async () => {
    await downloadCategoryTemplateWorkbook();
  };

  const handleDownloadBudgetTemplate = async () => {
    await downloadBudgetTemplateWorkbook({ year, categories });
  };

  const handleCategoryImport = async (file: File) => {
    setImportingCategories(true);
    setFeedback(null);

    try {
      const rows = await readCategoryImportFile(file);
      const categoryMap = new Map(categories.map((category) => [getCategoryLookupKey(category.name), category]));
      let created = 0;
      let updated = 0;

      for (const row of rows) {
        const rowKey = getCategoryLookupKey(row.name);
        const existingCategory = categoryMap.get(rowKey);

        if (existingCategory) {
          await api.updateCategory(existingCategory.id, row);
          updated += 1;
          continue;
        }

        const createdCategory = await api.createCategory(row);
        categoryMap.set(rowKey, createdCategory);
        created += 1;
      }

      await onReload();
      setFeedback({
        severity: "success",
        text: `Importacion completada. Partidas creadas: ${created}. Partidas actualizadas: ${updated}.`
      });
    } catch (error) {
      setFeedback({
        severity: "error",
        text: error instanceof Error ? error.message : "No se pudo importar el Excel de partidas."
      });
    } finally {
      setImportingCategories(false);
    }
  };

  const handleBudgetImport = async (file: File) => {
    setImportingBudgets(true);
    setFeedback(null);

    try {
      const rows = await readBudgetImportFile(file, year);
      const categoryMap = new Map(categories.map((category) => [getCategoryLookupKey(category.name), category]));

      for (const row of rows) {
        const category = categoryMap.get(getCategoryLookupKey(row.categoryName));

        if (!category) {
          throw new Error(`La partida "${row.categoryName}" no existe. Importa o crea antes esa partida.`);
        }

        await api.saveBudget({
          year: row.year,
          categoryId: category.id,
          plannedAmount: row.plannedAmount
        });
      }

      await onReload();
      setFeedback({
        severity: "success",
        text: `Importacion completada. Presupuestos actualizados: ${rows.length}.`
      });
    } catch (error) {
      setFeedback({
        severity: "error",
        text: error instanceof Error ? error.message : "No se pudo importar el Excel de presupuestos."
      });
    } finally {
      setImportingBudgets(false);
    }
  };

  const categoryRows = useMemo<CategoryRow[]>(
    () =>
      categories.map((category) => ({
        ...category,
        onEdit: () => openCategoryDialog(category),
        onDelete: () => {
          void handleDeleteCategory(category);
        }
      })),
    [categories]
  );

  const budgetRows = useMemo<BudgetRow[]>(
    () =>
      categories.map((category) => {
        const budget = budgets.find((item) => item.categoryId === category.id);

        return {
          id: category.id,
          budgetId: budget?.id,
          category,
          plannedAmount: Number(budget?.plannedAmount ?? 0),
          onEdit: () => openBudgetDialog(category.id, Number(budget?.plannedAmount ?? 0)),
          onDelete: budget
            ? () => {
                void handleDeleteBudget(budget.id);
              }
            : undefined
        };
      }),
    [budgets, categories]
  );

  return (
    <div className="grid">
      {feedback ? (
        <div className="col-12">
          <div className={`inline-feedback inline-feedback--${feedback.severity}`}>{feedback.text}</div>
        </div>
      ) : null}

      <div className="col-12 xl:col-5">
        <Card
          title="Partidas presupuestarias"
          subTitle="Define ingresos y gastos fijos o variables que usara la casa."
          className="panel-card"
        >
          <div className="panel-actions">
            <Button label="Nueva partida" icon="pi pi-plus" onClick={() => openCategoryDialog()} />
          </div>
          <ExcelTransferActions
            inputId="category-import-file"
            downloadLabel="Descargar ejemplo Excel"
            importLabel="Importar Excel partidas"
            importLoading={importingCategories}
            onDownload={handleDownloadCategoryTemplate}
            onImport={handleCategoryImport}
          />
          <p className="panel-note">
            Usa una fila por partida con las columnas nombre, descripcion, tipo, naturaleza y activa.
          </p>

          <DataTable value={categoryRows} size="small" paginator rows={8} emptyMessage="No hay partidas definidas.">
            <Column field="name" header="Partida" />
            <Column field="kind" header="Tipo" body={renderCategoryKind} />
            <Column field="nature" header="Naturaleza" body={renderCategoryNature} />
            <Column field="active" header="Estado" body={renderCategoryStatus} />
            <Column header="Acciones" body={renderCategoryActions} />
          </DataTable>
        </Card>
      </div>

      <div className="col-12 xl:col-7">
        <Card
          title={`Presupuesto previsto ${year}`}
          subTitle="Asigna el importe anual previsto a cada partida."
          className="panel-card"
        >
          <div className="panel-actions">
            <Button
              label="Configurar importe"
              icon="pi pi-euro"
              onClick={() => openBudgetDialog()}
              disabled={categories.length === 0}
            />
          </div>
          <ExcelTransferActions
            inputId="budget-import-file"
            downloadLabel="Descargar ejemplo Excel"
            importLabel="Importar Excel presupuestos"
            importDisabled={categories.length === 0}
            importLoading={importingBudgets}
            onDownload={handleDownloadBudgetTemplate}
            onImport={handleBudgetImport}
          />
          <p className="panel-note">
            El fichero debe incluir ano, partida e importe previsto. La partida debe existir previamente.
          </p>

          <DataTable value={budgetRows} size="small" paginator rows={8} emptyMessage="No hay partidas disponibles.">
            <Column field="category.name" header="Partida" />
            <Column field="category.kind" header="Tipo" body={renderBudgetKind} />
            <Column field="category.nature" header="Naturaleza" body={renderBudgetNature} />
            <Column field="plannedAmount" header="Importe previsto" body={renderBudgetAmount} className="text-right" />
            <Column header="Acciones" body={renderBudgetActions} />
          </DataTable>
        </Card>
      </div>

      <Dialog
        header={editingCategory ? "Editar partida" : "Nueva partida"}
        visible={categoryDialogVisible}
        style={{ width: "34rem" }}
        onHide={() => setCategoryDialogVisible(false)}
        footer={
          <div className="dialog-actions">
            <Button text label="Cancelar" onClick={() => setCategoryDialogVisible(false)} />
            <Button label="Guardar" loading={saving} onClick={saveCategory} />
          </div>
        }
      >
        <div className="form-grid">
          <div className="field">
            <label htmlFor="category-name">Nombre</label>
            <InputText
              id="category-name"
              value={categoryForm.name}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setCategoryForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="category-description">Descripcion</label>
            <InputText
              id="category-description"
              value={categoryForm.description}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setCategoryForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="category-kind">Tipo</label>
            <Dropdown
              id="category-kind"
              value={categoryForm.kind}
              options={kindOptions}
              onChange={(event: DropdownChangeEvent) =>
                setCategoryForm((current) => ({ ...current, kind: event.value }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="category-nature">Naturaleza</label>
            <Dropdown
              id="category-nature"
              value={categoryForm.nature}
              options={natureOptions}
              onChange={(event: DropdownChangeEvent) =>
                setCategoryForm((current) => ({ ...current, nature: event.value }))
              }
            />
          </div>
          <div className="field field-switch">
            <label htmlFor="category-active">Activa</label>
            <InputSwitch
              inputId="category-active"
              checked={categoryForm.active}
              onChange={(event: InputSwitchChangeEvent) =>
                setCategoryForm((current) => ({ ...current, active: Boolean(event.value) }))
              }
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        header={`Presupuesto anual ${year}`}
        visible={budgetDialogVisible}
        style={{ width: "30rem" }}
        onHide={() => setBudgetDialogVisible(false)}
        footer={
          <div className="dialog-actions">
            <Button text label="Cancelar" onClick={() => setBudgetDialogVisible(false)} />
            <Button label="Guardar" loading={saving} onClick={saveBudget} />
          </div>
        }
      >
        <div className="form-grid">
          <div className="field">
            <label htmlFor="budget-category">Partida</label>
            <Dropdown
              id="budget-category"
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
            <label htmlFor="budget-amount">Importe anual previsto</label>
            <InputNumber
              inputId="budget-amount"
              value={plannedAmount}
              onValueChange={(event: InputNumberValueChangeEvent) => setPlannedAmount(event.value ?? 0)}
              mode="currency"
              currency="EUR"
              locale="es-ES"
              min={0}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
