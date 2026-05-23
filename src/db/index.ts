import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const url = process.env.STORAGE_DATABASE_URL || process.env.DATABASE_URL!;
  const sql = neon(url);
  return drizzle(sql, { schema });
}

let cachedDb: ReturnType<typeof drizzle> | null = null;

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    if (!cachedDb) {
      cachedDb = createDb();
    }
    return cachedDb[prop as keyof ReturnType<typeof drizzle>];
  },
});
