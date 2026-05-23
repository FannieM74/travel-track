import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

export async function GET() {
  const url = process.env.DATABASE_URL || process.env.STORAGE_DATABASE_URL!;
  const sql = neon(url);

  const migrationPath = path.join(process.cwd(), "drizzle", "0000_third_dakota_north.sql");
  const migrationSql = fs.readFileSync(migrationPath, "utf8").replace(/--> statement-breakpoint/g, "");

  const statements = migrationSql.split(";").filter((s) => s.trim());

  const results: { sql: string; ok?: boolean; error?: string }[] = [];

  for (const stmt of statements) {
    try {
      await sql.query(stmt.trim());
      results.push({ sql: stmt.trim().slice(0, 80), ok: true });
    } catch (e: any) {
      results.push({ sql: stmt.trim().slice(0, 80), error: e.message.slice(0, 200) });
    }
  }

  return Response.json({ results });
}
