import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  downloadBudgetTemplateWorkbook,
  downloadCategoryTemplateWorkbook,
  downloadConsumptionTemplateWorkbook,
  getCategoryLookupKey,
  readBudgetImportFile,
  readCategoryImportFile,
  parseBudgetImportRows,
  parseCategoryImportRows,
  parseConsumptionImportRows
} from "./excel-import";
import { Category } from "../../api/types";

const { xlsxMock } = vi.hoisted(() => ({
  xlsxMock: {
    read: vi.fn(),
    writeFile: vi.fn(),
    utils: {
      book_new: vi.fn(() => ({ sheets: [] as Array<{ name: string; sheet: Record<string, unknown> }> })),
      json_to_sheet: vi.fn((rows: unknown) => ({ rows })),
      book_append_sheet: vi.fn(
        (workbook: { sheets: Array<{ name: string; sheet: Record<string, unknown> }> }, sheet, name: string) => {
          workbook.sheets.push({ name, sheet: sheet as Record<string, unknown> });
        }
      ),
      sheet_to_json: vi.fn()
    }
  }
}));

vi.mock("xlsx", () => xlsxMock);

const sampleCategory: Category = {
  id: "salary",
  name: "Nomina",
  description: "Ingreso principal",
  kind: "INCOME",
  nature: "FIXED",
  active: true
};

const createWorkbookFile = () =>
  ({
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
  }) as unknown as File;

describe("excel-import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    xlsxMock.read.mockReturnValue({
      SheetNames: ["datos"],
      Sheets: {
        datos: {}
      }
    });
    xlsxMock.utils.sheet_to_json.mockReturnValue([]);
  });

  it("convierte filas de partidas con alias en espanol", () => {
    const rows = parseCategoryImportRows([
      {
        Nombre: "Nomina",
        Descripcion: "Ingreso principal",
        Tipo: "ingreso",
        Naturaleza: "fija",
        Activa: "si"
      }
    ]);

    expect(rows).toEqual([
      {
        name: "Nomina",
        description: "Ingreso principal",
        kind: "INCOME",
        nature: "FIXED",
        active: true
      }
    ]);
  });

  it("convierte presupuestos usando el ano por defecto y coma decimal", () => {
    const rows = parseBudgetImportRows(
      [
        {
          partida: "Supermercado",
          importe_previsto: "1.250,50"
        }
      ],
      2026
    );

    expect(rows).toEqual([
      {
        year: 2026,
        categoryName: "Supermercado",
        plannedAmount: 1250.5
      }
    ]);
  });

  it("convierte consumos con mes en texto", () => {
    const rows = parseConsumptionImportRows([
      {
        ano: 2025,
        mes: "Febrero",
        partida: "Hipoteca",
        importe_real: 900
      }
    ]);

    expect(rows).toEqual([
      {
        year: 2025,
        month: 2,
        categoryName: "Hipoteca",
        actualAmount: 900
      }
    ]);
  });

  it("normaliza los nombres de partida para conciliarlos al importar", () => {
    expect(getCategoryLookupKey("  Nómina principal ")).toBe("nomina principal");
  });

  it("lee un Excel de partidas usando la hoja de datos", async () => {
    xlsxMock.utils.sheet_to_json.mockReturnValue([
      {
        nombre: "Seguro",
        descripcion: "Hogar",
        tipo: "EXPENSE",
        naturaleza: "FIXED",
        activa: "TRUE"
      }
    ]);

    const rows = await readCategoryImportFile(createWorkbookFile());

    expect(xlsxMock.read).toHaveBeenCalled();
    expect(rows).toEqual([
      {
        name: "Seguro",
        description: "Hogar",
        kind: "EXPENSE",
        nature: "FIXED",
        active: true
      }
    ]);
  });

  it("usa el ano por defecto al leer presupuestos y rechaza ficheros vacios", async () => {
    await expect(readBudgetImportFile(createWorkbookFile(), 2026)).rejects.toThrow(
      'El Excel no contiene filas de datos en la hoja "datos".'
    );

    xlsxMock.utils.sheet_to_json.mockReturnValue([
      {
        partida: "Nomina",
        importe_previsto: 18000
      }
    ]);

    await expect(readBudgetImportFile(createWorkbookFile(), 2026)).resolves.toEqual([
      {
        year: 2026,
        categoryName: "Nomina",
        plannedAmount: 18000
      }
    ]);
  });

  it("genera la plantilla Excel de partidas", async () => {
    await downloadCategoryTemplateWorkbook();

    expect(xlsxMock.utils.book_new).toHaveBeenCalled();
    expect(xlsxMock.utils.book_append_sheet).toHaveBeenCalledTimes(2);
    expect(xlsxMock.writeFile).toHaveBeenCalledWith(expect.any(Object), "plantilla-partidas.xlsx");
  });

  it("genera la plantilla Excel de presupuestos usando categorias reales", async () => {
    await downloadBudgetTemplateWorkbook({ year: 2026, categories: [sampleCategory] });

    expect(xlsxMock.utils.book_append_sheet).toHaveBeenCalledTimes(2);
    expect(xlsxMock.writeFile).toHaveBeenCalledWith(expect.any(Object), "plantilla-presupuestos-2026.xlsx");
  });

  it("genera la plantilla Excel de consumos incluso sin categorias cargadas", async () => {
    await downloadConsumptionTemplateWorkbook({ year: 2026, categories: [] });

    expect(xlsxMock.utils.book_append_sheet).toHaveBeenCalledTimes(2);
    expect(xlsxMock.writeFile).toHaveBeenCalledWith(expect.any(Object), "plantilla-consumos-2026.xlsx");
  });
});
