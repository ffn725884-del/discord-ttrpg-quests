import type { Knex } from "knex";
import path from "path";

const root = path.resolve(process.cwd());

const dbPath =
  process.env.DATABASE_URL || path.join(root, "data", "quests.db");

const config: Knex.Config = {
  client: "sqlite3",
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(root, "src", "db", "migrations"),
    extension: "ts",
    loadExtensions: [".ts"],
  },
};

export default config;
