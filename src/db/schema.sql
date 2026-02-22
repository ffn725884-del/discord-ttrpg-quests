-- Quest management schema for Discord TTRPG Quests

CREATE TABLE IF NOT EXISTS quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT NOT NULL,
  name TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  parent_quest_id INTEGER REFERENCES quests(id)
);

CREATE INDEX IF NOT EXISTS idx_quests_channel_id ON quests(channel_id);
CREATE INDEX IF NOT EXISTS idx_quests_channel_completed ON quests(channel_id, completed);
CREATE INDEX IF NOT EXISTS idx_quests_parent_quest_id ON quests(parent_quest_id);

CREATE TABLE IF NOT EXISTS quest_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quest_progress_quest_id ON quest_progress(quest_id);
