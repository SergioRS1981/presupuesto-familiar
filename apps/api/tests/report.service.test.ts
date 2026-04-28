import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, ensureYearBudgetMatrixMock } = vi.hoisted(() => ({
  prismaMock: {
    configuredYear: {
      findMany: vi.fn(),
      upsert: vi.fn()
    },
    annualBudget: {
      findMany: vi.fn()
    },
    monthlyConsumption: {
      findMany: vi.fn()
    }
  },
  ensureYearBudgetMatrixMock: vi.fn()
}));

vi.mock("../src/lib/prisma", () => ({
  prisma: prismaMock
}));

vi.mock("../src/modules/budgets/budget-provision.service", () => ({
  ensureYearBudgetMatrix: ensureYearBudgetMatrixMock
}));

import {
  createAvailableYear,
  ensureYearExists,
  getAvailableYears,
  updateAvailableYearStatus
} from "../src/modules/reports/report.service";

describe("report.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mezcla anos configurados y anos con datos sin duplicados", async () => {
    prismaMock.configuredYear.findMany.mockResolvedValue([
      { year: 2022, active: false },
      { year: 2024, active: true }
    ]);
    prismaMock.annualBudget.findMany.mockResolvedValue([{ year: 2023 }, { year: 2024 }]);
    prismaMock.monthlyConsumption.findMany.mockResolvedValue([{ year: 2021 }, { year: 2023 }]);

    const years = await getAvailableYears();

    expect(years).toEqual([
      { year: 2021, active: true },
      { year: 2022, active: false },
      { year: 2023, active: true },
      { year: 2024, active: true }
    ]);
  });

  it("crea o reutiliza anos configurados por upsert", async () => {
    prismaMock.configuredYear.upsert.mockResolvedValue({ year: 2020, active: true });

    const created = await createAvailableYear(2020);
    await ensureYearExists(2020);

    expect(created).toEqual({ year: 2020, active: true });
    expect(prismaMock.configuredYear.upsert).toHaveBeenNthCalledWith(1, {
      where: { year: 2020 },
      update: { active: true },
      create: { year: 2020, active: true }
    });
    expect(prismaMock.configuredYear.upsert).toHaveBeenNthCalledWith(2, {
      where: { year: 2020 },
      update: {},
      create: { year: 2020, active: true }
    });
    expect(ensureYearBudgetMatrixMock).toHaveBeenNthCalledWith(1, 2020);
    expect(ensureYearBudgetMatrixMock).toHaveBeenNthCalledWith(2, 2020);
  });

  it("permite desactivar un ano si queda al menos otro activo", async () => {
    prismaMock.configuredYear.findMany.mockResolvedValue([
      { year: 2024, active: true },
      { year: 2025, active: true }
    ]);
    prismaMock.annualBudget.findMany.mockResolvedValue([]);
    prismaMock.monthlyConsumption.findMany.mockResolvedValue([]);
    prismaMock.configuredYear.upsert.mockResolvedValue({ year: 2025, active: false });

    const updated = await updateAvailableYearStatus(2025, false);

    expect(updated).toEqual({ year: 2025, active: false });
    expect(prismaMock.configuredYear.upsert).toHaveBeenCalledWith({
      where: { year: 2025 },
      update: { active: false },
      create: { year: 2025, active: false }
    });
  });

  it("impide desactivar el ultimo ano activo", async () => {
    prismaMock.configuredYear.findMany.mockResolvedValue([{ year: 2024, active: true }]);
    prismaMock.annualBudget.findMany.mockResolvedValue([]);
    prismaMock.monthlyConsumption.findMany.mockResolvedValue([]);

    await expect(updateAvailableYearStatus(2024, false)).rejects.toThrow(
      "Debe quedar al menos un ano activo para poder navegar por la aplicacion."
    );
  });
});
