import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      revoked INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, channel_id)
    )
  `);
  await knex.raw(
    `CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash)`
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("api_keys");
}
