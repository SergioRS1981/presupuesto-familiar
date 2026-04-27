process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/presupuesto_familiar?schema=public";
process.env.PORT = process.env.PORT ?? "3001";
process.env.API_PREFIX = process.env.API_PREFIX ?? "/api";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ?? "200";
process.env.AUTH_USERNAME = process.env.AUTH_USERNAME ?? "sergio";
process.env.AUTH_PASSWORD_HASH =
  process.env.AUTH_PASSWORD_HASH ??
  "scrypt:RXLSLzN0vx7wqYTKvtMeng:yCQoZsTq-3Wa6a5ab7kmcECC-ZLTu6qcDgjW-pfa_JJmtz3owpdxngamhEwnio6HKYhCvNuZ1yZkjsZTBIAi3Q";
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET ?? "f063c9d732fc273208a2c42415c9e51f3b6e0c1e84a8c708e376a4bbe4398393";
process.env.SESSION_TTL_HOURS = process.env.SESSION_TTL_HOURS ?? "12";

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
