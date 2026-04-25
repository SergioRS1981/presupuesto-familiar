import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
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
  }
}));

vi.mock("../src/lib/prisma", () => ({
  prisma: prismaMock
}));

import { createAvailableYear, ensureYearExists, getAvailableYears } from "../src/modules/reports/report.service";

describe("report.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mezcla anos configurados y anos con datos sin duplicados", async () => {
    prismaMock.configuredYear.findMany.mockResolvedValue([{ year: 2022 }, { year: 2024 }]);
    prismaMock.annualBudget.findMany.mockResolvedValue([{ year: 2023 }, { year: 2024 }]);
    prismaMock.monthlyConsumption.findMany.mockResolvedValue([{ year: 2021 }, { year: 2023 }]);

    const years = await getAvailableYears();

    expect(years).toEqual([2021, 2022, 2023, 2024]);
  });

  it("crea o reutiliza anos configurados por upsert", async () => {
    prismaMock.configuredYear.upsert.mockResolvedValue({ year: 2020 });

    const created = await createAvailableYear(2020);
    await ensureYearExists(2020);

    expect(created).toEqual({ year: 2020 });
    expect(prismaMock.configuredYear.upsert).toHaveBeenNthCalledWith(1, {
      where: { year: 2020 },
      update: {},
      create: { year: 2020 }
    });
    expect(prismaMock.configuredYear.upsert).toHaveBeenNthCalledWith(2, {
      where: { year: 2020 },
      update: {},
      create: { year: 2020 }
    });
  });
});
