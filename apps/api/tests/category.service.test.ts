import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, ensureCategoryBudgetMatrixMock } = vi.hoisted(() => ({
  prismaMock: {
    budgetCategory: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  },
  ensureCategoryBudgetMatrixMock: vi.fn()
}));

vi.mock("../src/lib/prisma", () => ({
  prisma: prismaMock
}));

vi.mock("../src/modules/budgets/budget-provision.service", () => ({
  ensureCategoryBudgetMatrix: ensureCategoryBudgetMatrixMock
}));

import { createCategory } from "../src/modules/categories/category.service";

describe("category.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea la partida y la propaga a los anos existentes", async () => {
    prismaMock.budgetCategory.create.mockResolvedValue({
      id: "mortgage",
      name: "Hipoteca",
      description: "",
      kind: "EXPENSE",
      nature: "FIXED",
      active: true
    });

    const category = await createCategory({
      name: "Hipoteca",
      description: "",
      kind: "EXPENSE",
      nature: "FIXED",
      active: true
    });

    expect(category.id).toBe("mortgage");
    expect(ensureCategoryBudgetMatrixMock).toHaveBeenCalledWith("mortgage");
  });
});
