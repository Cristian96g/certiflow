import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");
const envPath = path.resolve(projectRoot, ".env");

const dotenvResult = dotenv.config({
  path: envPath,
});

const maskSecret = (value) => {
  if (!value) return value;
  if (value.length <= 12) return "***";
  return `${value.slice(0, 12)}...${value.slice(-6)}`;
};

console.log("[env] process.cwd():", process.cwd());
console.log("[env] projectRoot:", projectRoot);
console.log("[env] envPath:", envPath);
console.log("[env] .env exists:", fs.existsSync(envPath));
console.log("[env] dotenv parsed keys:", Object.keys(dotenvResult.parsed || {}));
console.log("[env] dotenv error:", dotenvResult.error?.message || null);
console.log("[env] process.env.MONGODB_URI exists:", Boolean(process.env.MONGODB_URI));
console.log("[env] process.env.MONGODB_URI preview:", maskSecret(process.env.MONGODB_URI));

if (!process.env.MONGODB_URI) {
  throw new Error(
    `MONGODB_URI is missing after dotenv load. Check backend/.env syntax and path: ${envPath}`,
  );
}

export const env = {
  port: Number(process.env.PORT || 4001),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || "changeme",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  generatedFilesRoot:
    process.env.GENERATED_FILES_ROOT || path.resolve(projectRoot, "storage"),
  certificateTemplatePath:
    process.env.CERTIFICATE_TEMPLATE_PATH ||
    path.resolve(projectRoot, "templates", "CERTIFICADO VERIFICAR.xlsx"),
  libreOfficePath: process.env.LIBREOFFICE_PATH || "",
  seedDefaultUser: process.env.SEED_DEFAULT_USER !== "false",
  defaultUserName: process.env.DEFAULT_USER_NAME || "Administrador",
  defaultUserEmail: process.env.DEFAULT_USER_EMAIL || "admin@certiflow.local",
  defaultUserPassword: process.env.DEFAULT_USER_PASSWORD || "admin123",
};
