import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  APP_ENV: z.string().min(1).default("development"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3001),
  API_PREFIX: z.string().min(1).default("/api"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200),
  AUTH_USERNAME: z.string().min(1),
  AUTH_PASSWORD_HASH: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(168)
});

export const env = envSchema.parse(process.env);
