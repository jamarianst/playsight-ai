import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../config.js";

const migrationsFolder = fileURLToPath(
  new URL("migrations", import.meta.url)
);
const { Pool } = pg;

async function run() {
  const config = loadConfig();
  const pool = new Pool({ connectionString: config.DATABASE_URL });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder });
  await pool.end();
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
