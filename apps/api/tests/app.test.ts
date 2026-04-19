process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/presupuesto_familiar?schema=public";
process.env.PORT = process.env.PORT ?? "3001";
process.env.API_PREFIX = process.env.API_PREFIX ?? "/api";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ?? "200";

import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

let app: Awaited<typeof import("../src/app")>["app"];

beforeAll(async () => {
  ({ app } = await import("../src/app"));
});

describe("app", () => {
  it("expone el healthcheck", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
