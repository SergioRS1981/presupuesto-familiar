import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    budgetCategory: {
      findMany: vi.fn()
    },
    configuredYear: {
      findMany: vi.fn()
    },
    annualBudget: {
      findMany: vi.fn(),
      createMany: vi.fn()
    },
    monthlyConsumption: {
      findMany: vi.fn()
    }
  }
}));

vi.mock("../src/lib/prisma", () => ({
  prisma: prismaMock
}));

import { ensureCategoryBudgetMatrix, ensureYearBudgetMatrix } from "../src/modules/budgets/budget-provision.service";

describe("budget-provision.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea presupuestos vacios para las partidas faltantes de un ano", async () => {
    prismaMock.budgetCategory.findMany.mockResolvedValue([{ id: "rent" }, { id: "salary" }]);
    prismaMock.annualBudget.findMany.mockResolvedValue([{ categoryId: "rent" }]);

    await ensureYearBudgetMatrix(2026);

    expect(prismaMock.annualBudget.createMany).toHaveBeenCalledWith({
      data: [{ year: 2026, categoryId: "salary", plannedAmount: 0 }],
      skipDuplicates: true
    });
  });

  it("no crea presupuestos si el ano ya esta completo", async () => {
    prismaMock.budgetCategory.findMany.mockResolvedValue([{ id: "rent" }]);
    prismaMock.annualBudget.findMany.mockResolvedValue([{ categoryId: "rent" }]);

    await ensureYearBudgetMatrix(2026);

    expect(prismaMock.annualBudget.createMany).not.toHaveBeenCalled();
  });

  it("propaga una partida nueva a todos los anos ya conocidos", async () => {
    prismaMock.configuredYear.findMany.mockResolvedValue([{ year: 2024 }]);
    prismaMock.annualBudget.findMany
      .mockResolvedValueOnce([{ year: 2025 }, { year: 2024 }])
      .mockResolvedValueOnce([{ year: 2024 }]);
    prismaMock.monthlyConsumption.findMany.mockResolvedValue([{ year: 2026 }]);

    await ensureCategoryBudgetMatrix("travel");

    expect(prismaMock.annualBudget.createMany).toHaveBeenCalledWith({
      data: [
        { year: 2025, categoryId: "travel", plannedAmount: 0 },
        { year: 2026, categoryId: "travel", plannedAmount: 0 }
      ],
      skipDuplicates: true
    });
  });

  it("no intenta propagar la partida si todavia no hay anos", async () => {
    prismaMock.configuredYear.findMany.mockResolvedValue([]);
    prismaMock.annualBudget.findMany.mockResolvedValue([]);
    prismaMock.monthlyConsumption.findMany.mockResolvedValue([]);

    await ensureCategoryBudgetMatrix("travel");

    expect(prismaMock.annualBudget.createMany).not.toHaveBeenCalled();
  });
});
