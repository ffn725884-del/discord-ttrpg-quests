import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL,
      name TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      prepared INTEGER NOT NULL DEFAULT 0,
      parent_quest_id INTEGER REFERENCES quests(id)
    )
  `);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_quests_channel_id ON quests(channel_id)`);
  await knex.raw(
    `CREATE INDEX IF NOT EXISTS idx_quests_channel_completed ON quests(channel_id, completed)`
  );
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_quests_parent_quest_id ON quests(parent_quest_id)`);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS quest_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);
  await knex.raw(
    `CREATE INDEX IF NOT EXISTS idx_quest_progress_quest_id ON quest_progress(quest_id)`
  );

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS gm_roles (
      guild_id TEXT NOT NULL PRIMARY KEY,
      role_id TEXT NOT NULL
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("gm_roles");
  await knex.schema.dropTableIfExists("quest_progress");
  await knex.schema.dropTableIfExists("quests");
}
