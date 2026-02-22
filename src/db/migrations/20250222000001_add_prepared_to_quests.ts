import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const tableInfo = await knex.raw<{ name: string }[]>("PRAGMA table_info(quests)");
  const hasPrepared = tableInfo.some((c) => c.name === "prepared");
  if (!hasPrepared) {
    await knex.raw(
      "ALTER TABLE quests ADD COLUMN prepared INTEGER NOT NULL DEFAULT 0"
    );
  }
  await knex.raw(
    "CREATE INDEX IF NOT EXISTS idx_quests_channel_prepared ON quests(channel_id, prepared)"
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP INDEX IF EXISTS idx_quests_channel_prepared");
  // SQLite does not support DROP COLUMN easily; leave column in place
}
