import knex, { type Knex } from "knex";
import path from "path";
import fs from "fs";
import config from "../../knexfile";

const dbPath = (config.connection as { filename: string }).filename;

export const db: Knex = knex(config);

/**
 * Initializes the database: ensures data directory exists and runs migrations.
 */
export async function initSchema(): Promise<void> {
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  await db.migrate.latest();
}
