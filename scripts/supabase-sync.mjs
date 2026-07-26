#!/usr/bin/env node
/**
 * Applies Supabase schema (first run) and re-applies RLS permissions every time.
 * Requires DATABASE_URL in .env.local (Supabase → Settings → Database → connection string).
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) {
    console.warn("[supabase-sync] No .env.local found — skipping.");
    process.exit(0);
  }
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function runSqlFile(sql, label) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes("[password]")) {
    console.warn(
      `[supabase-sync] DATABASE_URL not set in .env.local — cannot run ${label}.`
    );
    return false;
  }

  const sqlClient = postgres(databaseUrl, { max: 1, ssl: "require" });
  try {
    await sqlClient.unsafe(sql);
    console.log(`[supabase-sync] ✓ ${label}`);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Schema may already exist on repeat runs
    if (label === "schema" && message.includes("already exists")) {
      console.log(`[supabase-sync] ✓ schema (already applied)`);
      return true;
    }
    console.error(`[supabase-sync] ✗ ${label}:`, message);
    return false;
  } finally {
    await sqlClient.end();
  }
}

async function main() {
  loadEnv();

  const schemaPath = resolve(root, "supabase/migrations/001_initial_schema.sql");
  const permissionsPath = resolve(root, "supabase/permissions.sql");

  let ok = true;

  if (existsSync(schemaPath)) {
    const schema = readFileSync(schemaPath, "utf8");
    const schemaOk = await runSqlFile(schema, "schema");
    ok = ok && schemaOk;
  }

  if (existsSync(permissionsPath)) {
    const permissions = readFileSync(permissionsPath, "utf8");
    const permsOk = await runSqlFile(permissions, "permissions");
    ok = ok && permsOk;
  }

  const adminPath = resolve(root, "supabase/migrations/002_admin_settings.sql");
  if (existsSync(adminPath)) {
    const adminSql = readFileSync(adminPath, "utf8");
    const adminOk = await runSqlFile(adminSql, "admin_settings");
    ok = ok && adminOk;
  }

  if (!ok) {
    console.warn(
      "[supabase-sync] Sync failed — app can still run if schema was applied via Supabase dashboard/MCP."
    );
    process.exit(0);
  }

  process.exit(0);
}

main();
