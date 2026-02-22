import knex, { type Knex } from "knex";
import path from "path";
import fs from "fs";

const dbPath =
  process.env.DATABASE_URL ||
  path.join(process.cwd(), "data", "quests.db");

export const db: Knex = knex({
  client: "sqlite3",
  connection: { filename: dbPath },
  useNullAsDefault: true,
});

/**
 * Initializes the database schema: creates data directory if needed, migrates from
 * legacy schema if present, and runs schema.sql to create tables.
 */
export async function initSchema(): Promise<void> {
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const hasQuestsTable = await db.schema.hasTable("quests");
  if (hasQuestsTable) {
    const tableInfo = await db.raw<{ name: string; type: string }[]>(
      "PRAGMA table_info(quests)"
    );
    const idCol = tableInfo.find((c) => c.name === "id");
    if (idCol && String(idCol.type).toUpperCase() === "TEXT") {
      await db.schema.dropTableIfExists("quest_progress");
      await db.schema.dropTableIfExists("quests");
    }
  }

  const schemaPath = path.join(process.cwd(), "src", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await db.raw(statement + ";");
  }
}
