import { defineConfig } from "drizzle-kit";
import { loadConfig } from "./src/config.js";

const config = loadConfig();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgres",
  dbCredentials: { url: config.DATABASE_URL },
});
