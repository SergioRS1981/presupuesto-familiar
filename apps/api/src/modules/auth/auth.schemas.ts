import { z } from "zod";

export const loginPayloadSchema = z.object({
  username: z.string().trim().min(1, "El usuario es obligatorio."),
  password: z.string().min(1, "La contrasena es obligatoria.")
});
