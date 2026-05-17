import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

function buildConnectionConfig(): pg.PoolConfig {
  if (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE) {
    return {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: undefined,
    };
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  let connectionString = process.env.DATABASE_URL;
  const useSsl =
    /sslmode=(?:require|verify-ca|verify-full)/i.test(connectionString) ||
    /\.aivencloud\.com/i.test(connectionString);

  if (useSsl) {
    try {
      const u = new URL(connectionString);
      u.searchParams.delete("sslmode");
      connectionString = u.toString();
    } catch {
      connectionString = connectionString
        .replace(/[?&]sslmode=[^&]*/i, "")
        .replace(/\?$/, "")
        .replace(/&&/g, "&");
    }
  }

  return {
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  };
}

export const pool = new Pool(buildConnectionConfig());

export const db = drizzle(pool, { schema });

export * from "./schema";
