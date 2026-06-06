import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://localhost:5432/reelspect",
});

export const db = {
  query: (text: string, params?: unknown[]) => pool.query(text, params),
};
