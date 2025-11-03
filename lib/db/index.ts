import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Load environment variables if not already loaded (for standalone scripts)
if (!process.env.DATABASE_URL) {
  try {
    const dotenv = require("dotenv");
    dotenv.config({ path: ".env.local" });
    dotenv.config(); // Fallback to .env
  } catch {
    // dotenv might not be available in all contexts
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
export { pool };
