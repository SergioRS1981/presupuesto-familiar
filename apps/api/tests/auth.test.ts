import { describe, expect, it } from "vitest";
import { createPasswordHash, createSessionToken, readSessionToken, verifyPassword } from "../src/lib/auth";

describe("auth helpers", () => {
  it("verifica contrasenas scrypt", () => {
    const hash = createPasswordHash("Presupuesto.Dev.2026!");

    expect(verifyPassword("Presupuesto.Dev.2026!", hash)).toBe(true);
    expect(verifyPassword("incorrecta", hash)).toBe(false);
  });

  it("firma y valida tokens de sesion", () => {
    const ttlHours = 168;
    const beforeNow = Math.floor(Date.now() / 1000);
    const token = createSessionToken("sergio", "0123456789abcdef0123456789abcdef", ttlHours);
    const payload = readSessionToken(token, "0123456789abcdef0123456789abcdef");

    expect(payload?.sub).toBe("sergio");
    expect(payload?.exp).toBeGreaterThanOrEqual(beforeNow + ttlHours * 60 * 60 - 1);
    expect(readSessionToken(token, "secret-distinto")).toBeNull();
  });
});
