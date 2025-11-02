import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

// Load .env.local first, then fallback to .env
dotenv.config({ path: ".env.local" });
dotenv.config(); // This will load .env if .env.local doesn't exist

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Make sure it's in .env.local or .env");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function runMigrations() {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  console.log("Migrations completed!");
  await pool.end();
}

runMigrations().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
