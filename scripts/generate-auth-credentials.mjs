import crypto from "crypto";

const username = process.argv[2] ?? "admin";
const password = process.argv[3];

if (!password) {
  console.error("Uso: node scripts/generate-auth-credentials.mjs <usuario> <contrasena>");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("base64url");
const hash = crypto.scryptSync(password, salt, 64).toString("base64url");
const sessionSecret = crypto.randomBytes(32).toString("hex");

console.log(`AUTH_USERNAME=${username}`);
console.log(`AUTH_PASSWORD_HASH=scrypt:${salt}:${hash}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log("SESSION_TTL_HOURS=12");
