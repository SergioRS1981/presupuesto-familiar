import { BudgetKind, BudgetNature, Category } from "../../api/types";
import { monthOptions } from "../../utils/months";

type WorkbookRow = Record<string, unknown>;

export type CategoryImportRow = {
  name: string;
  description: string;
  kind: BudgetKind;
  nature: BudgetNature;
  active: boolean;
};

export type BudgetImportRow = {
  year: number;
  categoryName: string;
  plannedAmount: number;
};

export type ConsumptionImportRow = {
  year: number;
  month: number;
  categoryName: string;
  actualAmount: number;
};

type TemplateContext = {
  year: number;
  categories: Category[];
};

const dataSheetName = "datos";
const instructionsSheetName = "instrucciones";

const normalizeText = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const normalizeHeader = (value: string) => normalizeText(value).replace(/[^a-z0-9]/g, "");

const hasData = (value: unknown) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== null && value !== undefined;
};

const isBlankRow = (row: WorkbookRow) => !Object.values(row).some(hasData);

const getValue = (row: WorkbookRow, aliases: string[]) => {
  const normalizedAliases = new Set(aliases.map(normalizeHeader));

  const entry = Object.entries(row).find(([key]) => normalizedAliases.has(normalizeHeader(key)));

  return entry?.[1];
};

const requireString = (row: WorkbookRow, aliases: string[], fieldLabel: string, rowNumber: number) => {
  const value = getValue(row, aliases);

  if (!hasData(value)) {
    throw new Error(`La fila ${rowNumber} no incluye el campo obligatorio "${fieldLabel}".`);
  }

  return String(value).trim();
};

const parseNumber = (value: unknown, fieldLabel: string, rowNumber: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (!hasData(value)) {
    throw new Error(`La fila ${rowNumber} no incluye el campo obligatorio "${fieldLabel}".`);
  }

  const raw = String(value).trim().replace(/\s/g, "");
  const commaIndex = raw.lastIndexOf(",");
  const dotIndex = raw.lastIndexOf(".");
  const normalized = commaIndex > dotIndex ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new Error(`La fila ${rowNumber} contiene un valor no valido en "${fieldLabel}".`);
  }

  return parsed;
};

const parseYear = (value: unknown, rowNumber: number, defaultYear?: number) => {
  if (!hasData(value)) {
    if (defaultYear !== undefined) {
      return defaultYear;
    }

    throw new Error(`La fila ${rowNumber} no incluye el campo obligatorio "ano".`);
  }

  const year = Math.trunc(parseNumber(value, "ano", rowNumber));

  if (year < 2000 || year > 2100) {
    throw new Error(`La fila ${rowNumber} contiene un ano fuera de rango.`);
  }

  return year;
};

const parseKind = (value: string, rowNumber: number): BudgetKind => {
  const normalized = normalizeText(value);

  if (normalized === "income" || normalized === "ingreso" || normalized === "ingresos") {
    return "INCOME";
  }

  if (normalized === "expense" || normalized === "gasto" || normalized === "gastos") {
    return "EXPENSE";
  }

  throw new Error(`La fila ${rowNumber} contiene un tipo de partida no valido.`);
};

const parseNature = (value: string, rowNumber: number): BudgetNature => {
  const normalized = normalizeText(value);

  if (normalized === "fixed" || normalized === "fija" || normalized === "fijo") {
    return "FIXED";
  }

  if (normalized === "variable") {
    return "VARIABLE";
  }

  throw new Error(`La fila ${rowNumber} contiene una naturaleza de partida no valida.`);
};

const parseBoolean = (value: unknown, rowNumber: number) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (!hasData(value)) {
    return true;
  }

  const normalized = normalizeText(String(value));

  if (["true", "1", "si", "sí", "s", "activa", "activo", "yes"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "n", "inactiva", "inactivo"].includes(normalized)) {
    return false;
  }

  throw new Error(`La fila ${rowNumber} contiene un valor no valido en "activa".`);
};

const monthNames = new Map(monthOptions.map((option) => [normalizeText(option.label), option.value]));

const parseMonth = (value: unknown, rowNumber: number) => {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 12) {
    return value;
  }

  if (!hasData(value)) {
    throw new Error(`La fila ${rowNumber} no incluye el campo obligatorio "mes".`);
  }

  const raw = String(value).trim();
  const numeric = Number(raw);

  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) {
    return numeric;
  }

  const normalized = normalizeText(raw);
  const month = monthNames.get(normalized);

  if (!month) {
    throw new Error(`La fila ${rowNumber} contiene un mes no valido.`);
  }

  return month;
};

const ensureRows = (rows: WorkbookRow[]) => {
  const filteredRows = rows.filter((row) => !isBlankRow(row));

  if (filteredRows.length === 0) {
    throw new Error(`El Excel no contiene filas de datos en la hoja "${dataSheetName}".`);
  }

  return filteredRows;
};

const loadXlsx = async () => import("xlsx");

const readWorkbookRows = async (file: File) => {
  const xlsx = await loadXlsx();
  const buffer = await file.arrayBuffer();
  const workbook = xlsx.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames.includes(dataSheetName) ? dataSheetName : workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("El Excel no contiene hojas legibles.");
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<WorkbookRow>(worksheet, { defval: "" });

  return ensureRows(rows);
};

export const parseCategoryImportRows = (rows: WorkbookRow[]): CategoryImportRow[] =>
  ensureRows(rows).map((row, index) => {
    const rowNumber = index + 2;
    const name = requireString(row, ["nombre", "name"], "nombre", rowNumber);
    const descriptionValue = getValue(row, ["descripcion", "description"]);
    const description = hasData(descriptionValue) ? String(descriptionValue).trim() : "";
    const kind = parseKind(requireString(row, ["tipo", "kind"], "tipo", rowNumber), rowNumber);
    const nature = parseNature(requireString(row, ["naturaleza", "nature"], "naturaleza", rowNumber), rowNumber);
    const active = parseBoolean(getValue(row, ["activa", "active"]), rowNumber);

    return {
      name,
      description,
      kind,
      nature,
      active
    };
  });

export const parseBudgetImportRows = (rows: WorkbookRow[], defaultYear?: number): BudgetImportRow[] =>
  ensureRows(rows).map((row, index) => {
    const rowNumber = index + 2;

    return {
      year: parseYear(getValue(row, ["ano", "año", "year"]), rowNumber, defaultYear),
      categoryName: requireString(row, ["partida", "categoria", "category", "categoryname"], "partida", rowNumber),
      plannedAmount: parseNumber(
        getValue(row, ["importeprevisto", "plannedamount", "importe_previsto", "previsto"]),
        "importe previsto",
        rowNumber
      )
    };
  });

export const parseConsumptionImportRows = (rows: WorkbookRow[], defaultYear?: number): ConsumptionImportRow[] =>
  ensureRows(rows).map((row, index) => {
    const rowNumber = index + 2;

    return {
      year: parseYear(getValue(row, ["ano", "año", "year"]), rowNumber, defaultYear),
      month: parseMonth(getValue(row, ["mes", "month"]), rowNumber),
      categoryName: requireString(row, ["partida", "categoria", "category", "categoryname"], "partida", rowNumber),
      actualAmount: parseNumber(
        getValue(row, ["importereal", "actualamount", "importe_real", "real"]),
        "importe real",
        rowNumber
      )
    };
  });

export const readCategoryImportFile = async (file: File) => parseCategoryImportRows(await readWorkbookRows(file));

export const readBudgetImportFile = async (file: File, defaultYear?: number) =>
  parseBudgetImportRows(await readWorkbookRows(file), defaultYear);

export const readConsumptionImportFile = async (file: File, defaultYear?: number) =>
  parseConsumptionImportRows(await readWorkbookRows(file), defaultYear);

const buildInstructionsSheet = async (rows: Array<{ campo: string; regla: string }>) => {
  const xlsx = await loadXlsx();
  const sheet = xlsx.utils.json_to_sheet(rows);
  sheet["!cols"] = [{ wch: 24 }, { wch: 90 }];
  return sheet;
};

const writeWorkbook = async (
  fileName: string,
  dataRows: WorkbookRow[],
  instructionRows: Array<{ campo: string; regla: string }>
) => {
  const xlsx = await loadXlsx();
  const workbook = xlsx.utils.book_new();
  const dataSheet = xlsx.utils.json_to_sheet(dataRows);
  dataSheet["!cols"] = Object.keys(dataRows[0] ?? {}).map((key) => ({ wch: Math.max(key.length + 4, 18) }));

  xlsx.utils.book_append_sheet(workbook, dataSheet, dataSheetName);
  xlsx.utils.book_append_sheet(workbook, await buildInstructionsSheet(instructionRows), instructionsSheetName);
  xlsx.writeFile(workbook, fileName);
};

const getTemplateCategories = (categories: Category[]) => {
  if (categories.length > 0) {
    return categories.slice(0, 3);
  }

  return [
    {
      id: "sample-income",
      name: "Nomina",
      description: "Ingreso mensual habitual",
      kind: "INCOME" as BudgetKind,
      nature: "FIXED" as BudgetNature,
      active: true
    },
    {
      id: "sample-expense",
      name: "Supermercado",
      description: "Compra mensual",
      kind: "EXPENSE" as BudgetKind,
      nature: "VARIABLE" as BudgetNature,
      active: true
    }
  ];
};

export const downloadCategoryTemplateWorkbook = async () => {
  await writeWorkbook(
    "plantilla-partidas.xlsx",
    [
      {
        nombre: "Nomina",
        descripcion: "Ingreso mensual habitual",
        tipo: "INCOME",
        naturaleza: "FIXED",
        activa: "TRUE"
      },
      {
        nombre: "Supermercado",
        descripcion: "Compra mensual",
        tipo: "EXPENSE",
        naturaleza: "VARIABLE",
        activa: "TRUE"
      }
    ],
    [
      { campo: "nombre", regla: "Obligatorio y unico. Si ya existe una partida con ese nombre, se actualizara." },
      { campo: "descripcion", regla: "Opcional." },
      { campo: "tipo", regla: "Usa INCOME para ingresos o EXPENSE para gastos." },
      { campo: "naturaleza", regla: "Usa FIXED para fijas o VARIABLE para variables." },
      { campo: "activa", regla: "Opcional. TRUE/FALSE, SI/NO, 1/0." }
    ]
  );
};

export const downloadBudgetTemplateWorkbook = async ({ year, categories }: TemplateContext) => {
  const templateCategories = getTemplateCategories(categories);

  await writeWorkbook(
    `plantilla-presupuestos-${year}.xlsx`,
    templateCategories.map((category, index) => ({
      ano: year,
      partida: category.name,
      importe_previsto: index === 0 ? 18000 : 3600
    })),
    [
      { campo: "ano", regla: "Opcional si importas desde el ano seleccionado en pantalla. Si se informa, debe ser valido." },
      {
        campo: "partida",
        regla: "Obligatorio. La partida debe existir previamente en el sistema o haberse importado antes."
      },
      { campo: "importe_previsto", regla: "Obligatorio. Se admiten importes con coma o punto decimal." }
    ]
  );
};

export const downloadConsumptionTemplateWorkbook = async ({ year, categories }: TemplateContext) => {
  const templateCategories = getTemplateCategories(categories);
  const firstCategory = templateCategories[0];
  const secondCategory = templateCategories[Math.min(1, templateCategories.length - 1)] ?? firstCategory;

  await writeWorkbook(
    `plantilla-consumos-${year}.xlsx`,
    [
      {
        ano: year,
        mes: "Enero",
        partida: firstCategory.name,
        importe_real: 1500
      },
      {
        ano: year,
        mes: "Febrero",
        partida: secondCategory.name,
        importe_real: 320
      }
    ],
    [
      { campo: "ano", regla: "Opcional si importas desde el ano seleccionado en pantalla. Si se informa, debe ser valido." },
      { campo: "mes", regla: "Obligatorio. Admite 1-12 o el nombre del mes en espanol." },
      {
        campo: "partida",
        regla: "Obligatorio. La partida debe existir previamente en el sistema o haberse importado antes."
      },
      { campo: "importe_real", regla: "Obligatorio. Se admiten importes con coma o punto decimal." }
    ]
  );
};

export const getCategoryLookupKey = (name: string) => normalizeText(name);
