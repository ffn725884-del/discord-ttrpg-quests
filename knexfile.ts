import type { Knex } from "knex";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath =
  process.env.DATABASE_URL ||
  path.join(__dirname, "data", "quests.db");

const config: Knex.Config = {
  client: "sqlite3",
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
};

export default config;
