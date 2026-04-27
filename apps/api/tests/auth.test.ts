import { describe, expect, it } from "vitest";
import { createPasswordHash, createSessionToken, readSessionToken, verifyPassword } from "../src/lib/auth";

describe("auth helpers", () => {
  it("verifica contrasenas scrypt", () => {
    const hash = createPasswordHash("Presupuesto.Dev.2026!");

    expect(verifyPassword("Presupuesto.Dev.2026!", hash)).toBe(true);
    expect(verifyPassword("incorrecta", hash)).toBe(false);
  });

  it("firma y valida tokens de sesion", () => {
    const token = createSessionToken("sergio", "0123456789abcdef0123456789abcdef", 12);
    const payload = readSessionToken(token, "0123456789abcdef0123456789abcdef");

    expect(payload?.sub).toBe("sergio");
    expect(readSessionToken(token, "secret-distinto")).toBeNull();
  });
});
