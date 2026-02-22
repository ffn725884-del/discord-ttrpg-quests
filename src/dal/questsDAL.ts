import { db } from "../db/index";

export interface Quest {
  id: string;
  channelId: string;
  name: string;
  progress: string[];
  completed?: boolean;
  prepared?: boolean;
  parentQuestId?: string;
}

interface QuestRow {
  id: number;
  channel_id: string;
  name: string;
  completed: number;
  prepared?: number;
  parent_quest_id: number | null;
}

interface ProgressRow {
  quest_id: number;
  text: string;
  sort_order: number;
}

function idToString(id: number): string {
  return String(id);
}

async function questsWithProgress(
  questRows: QuestRow[]
): Promise<Quest[]> {
  if (questRows.length === 0) return [];

  const questIds = questRows.map((r) => r.id);
  const progressRows = await db<ProgressRow>("quest_progress")
    .select("quest_id", "text", "sort_order")
    .whereIn("quest_id", questIds)
    .orderBy("quest_id")
    .orderBy("sort_order");

  const progressByQuest = new Map<number, string[]>();
  for (const p of progressRows) {
    const list = progressByQuest.get(p.quest_id) ?? [];
    list.push(p.text);
    progressByQuest.set(p.quest_id, list);
  }

  return questRows.map((r) => ({
    id: idToString(r.id),
    channelId: r.channel_id,
    name: r.name,
    progress: progressByQuest.get(r.id) ?? [],
    completed: Boolean(r.completed),
    prepared: Boolean((r as QuestRow).prepared ?? 0),
    parentQuestId: r.parent_quest_id != null ? idToString(r.parent_quest_id) : undefined,
  }));
}

/**
 * Fetches a single quest by channel and quest ID.
 *
 * @param channelId - The Discord channel ID
 * @param questId - The quest ID (string)
 * @returns The quest if found, null otherwise
 */
export async function getQuest(
  channelId: string,
  questId: string
): Promise<Quest | null> {
  const id = parseInt(questId, 10);
  if (Number.isNaN(id)) return null;
  const rows = await db<QuestRow>("quests")
    .where({ channel_id: channelId, id })
    .select("id", "channel_id", "name", "completed", "prepared", "parent_quest_id");
  const quests = await questsWithProgress(rows);
  return quests[0] ?? null;
}

/**
 * Fetches all active (non-completed) quests for a channel.
 *
 * @param channelId - The Discord channel ID
 * @returns Array of active quests
 */
export async function getActiveQuests(channelId: string): Promise<Quest[]> {
  const rows = await db<QuestRow>("quests")
    .where({ channel_id: channelId, completed: 0, prepared: 0 })
    .select("id", "channel_id", "name", "completed", "prepared", "parent_quest_id");
  return questsWithProgress(rows);
}

/** Returns only top-level active quests (no parent, not prepared). */
export async function getTopLevelActiveQuests(
  channelId: string
): Promise<Quest[]> {
  const rows = await db<QuestRow>("quests")
    .where({ channel_id: channelId, completed: 0, prepared: 0 })
    .whereNull("parent_quest_id")
    .select("id", "channel_id", "name", "completed", "prepared", "parent_quest_id");
  return questsWithProgress(rows);
}

/** Returns subquests of a given parent quest (excludes prepared). */
export async function getSubquests(
  channelId: string,
  parentQuestId: string
): Promise<Quest[]> {
  const rows = await db<QuestRow>("quests")
    .where({
      channel_id: channelId,
      parent_quest_id: parseInt(parentQuestId, 10),
      prepared: 0,
    })
    .select("id", "channel_id", "name", "completed", "prepared", "parent_quest_id");
  return questsWithProgress(rows);
}

/**
 * Fetches all completed quests for a channel.
 *
 * @param channelId - The Discord channel ID
 * @returns Array of completed quests
 */
export async function getCompletedQuests(channelId: string): Promise<Quest[]> {
  const rows = await db<QuestRow>("quests")
    .where({ channel_id: channelId, completed: 1, prepared: 0 })
    .select("id", "channel_id", "name", "completed", "prepared", "parent_quest_id");
  return questsWithProgress(rows);
}

/** Returns all quests (active and completed, excludes prepared) for a channel. */
export async function getAllQuests(channelId: string): Promise<Quest[]> {
  const rows = await db<QuestRow>("quests")
    .where({ channel_id: channelId, prepared: 0 })
    .select("id", "channel_id", "name", "completed", "prepared", "parent_quest_id");
  return questsWithProgress(rows);
}

/** Permanently deletes a quest and its subquests (and their progress). */
export async function deleteQuest(
  channelId: string,
  questId: string
): Promise<boolean> {
  const id = parseInt(questId, 10);
  if (Number.isNaN(id)) return false;

  const quest = await db<QuestRow>("quests")
    .where({ channel_id: channelId, id })
    .first();
  if (!quest) return false;

  await db.transaction(async (trx) => {
    const idsToDelete = [id];
    for (;;) {
      const children = await trx<{ id: number }>("quests")
        .where("channel_id", channelId)
        .whereIn("parent_quest_id", idsToDelete)
        .select("id");
      const newIds = children
        .map((r) => r.id)
        .filter((i) => !idsToDelete.includes(i));
      if (newIds.length === 0) break;
      idsToDelete.push(...newIds);
    }

    await trx("quest_progress").whereIn("quest_id", idsToDelete).delete();
    await trx("quests").whereIn("id", idsToDelete).delete();
  });

  return true;
}

/**
 * Marks a quest as completed with the given resolution. Auto-completes active subquests.
 *
 * @param channelId - The Discord channel ID
 * @param questId - The quest ID
 * @param resolutionText - Resolution text (stored as final progress entry)
 * @returns true if the quest was found and completed, false otherwise
 */
export async function completeQuest(
  channelId: string,
  questId: string,
  resolutionText: string
): Promise<boolean> {
  const id = parseInt(questId, 10);
  if (Number.isNaN(id)) return false;

  const quest = await db<QuestRow>("quests")
    .where({ channel_id: channelId, id })
    .first();
  if (!quest) return false;

  const maxOrder = await db("quest_progress")
    .where({ quest_id: id })
    .max("sort_order as max")
    .first();
  const nextOrder = ((maxOrder?.max as number) ?? -1) + 1;

  await db.transaction(async (trx) => {
    await trx("quest_progress").insert({
      quest_id: id,
      text: resolutionText.trim(),
      sort_order: nextOrder,
    });
    await trx("quests").where({ id }).update({ completed: 1 });

    const subquests = await trx<QuestRow>("quests").where({
      channel_id: channelId,
      parent_quest_id: id,
      completed: 0,
      prepared: 0,
    });

    for (const sub of subquests) {
      const subMaxOrder = await trx("quest_progress")
        .where({ quest_id: sub.id })
        .max("sort_order as max")
        .first();
      const subNextOrder = ((subMaxOrder?.max as number) ?? -1) + 1;
      await trx("quest_progress").insert({
        quest_id: sub.id,
        text: "(Auto-completed with parent quest)",
        sort_order: subNextOrder,
      });
      await trx("quests").where({ id: sub.id }).update({ completed: 1 });
    }
  });

  return true;
}

/**
 * Appends a progress entry to an existing quest.
 *
 * @param channelId - The Discord channel ID
 * @param questId - The quest ID
 * @param progressText - Progress text to add
 * @returns true if the quest was found and progress was added, false otherwise
 */
export async function addQuestProgress(
  channelId: string,
  questId: string,
  progressText: string
): Promise<boolean> {
  const id = parseInt(questId, 10);
  if (Number.isNaN(id)) return false;

  const quest = await db<QuestRow>("quests")
    .where({ channel_id: channelId, id })
    .first();
  if (!quest) return false;

  const maxOrder = await db("quest_progress")
    .where({ quest_id: id })
    .max("sort_order as max")
    .first();
  const nextOrder = ((maxOrder?.max as number) ?? -1) + 1;

  await db("quest_progress").insert({
    quest_id: id,
    text: progressText,
    sort_order: nextOrder,
  });
  return true;
}

export interface AddQuestInput {
  name: string;
  progress?: string[];
  parentQuestId?: string;
  prepared?: boolean;
}

/** Returns the total count of quests (active + completed) for a channel. */
export async function getQuestCount(channelId: string): Promise<number> {
  const result = await db("quests")
    .where({ channel_id: channelId })
    .count("* as count")
    .first();
  return Number(result?.count ?? 0);
}

/** Returns all prepared quests for a channel. */
export async function getPreparedQuests(channelId: string): Promise<Quest[]> {
  const rows = await db<QuestRow>("quests")
    .where({ channel_id: channelId, prepared: 1 })
    .select("id", "channel_id", "name", "completed", "prepared", "parent_quest_id");
  return questsWithProgress(rows);
}

/** Returns top-level quests (active or prepared) for parent selection in prepare modal. */
export async function getTopLevelQuestsForParentSelect(
  channelId: string
): Promise<Quest[]> {
  const rows = await db<QuestRow>("quests")
    .where("channel_id", channelId)
    .whereNull("parent_quest_id")
    .where((builder) => {
      builder
        .where({ completed: 0, prepared: 0 })
        .orWhere({ prepared: 1 });
    })
    .select("id", "channel_id", "name", "completed", "prepared", "parent_quest_id");
  return questsWithProgress(rows);
}

/** Reveals a prepared quest (sets prepared = 0). Returns the quest or null. */
export async function revealPreparedQuest(
  channelId: string,
  questId: string
): Promise<Quest | null> {
  const id = parseInt(questId, 10);
  if (Number.isNaN(id)) return null;

  const quest = await db<QuestRow>("quests")
    .where({ channel_id: channelId, id, prepared: 1 })
    .first();
  if (!quest) return null;

  await db("quests").where({ id }).update({ prepared: 0 });
  const rows = await db<QuestRow>("quests")
    .where({ channel_id: channelId, id })
    .select("id", "channel_id", "name", "completed", "prepared", "parent_quest_id");
  const quests = await questsWithProgress(rows);
  return quests[0] ?? null;
}

/** Permanently removes all quests (and their progress) for a channel. */
export async function clearAllQuests(channelId: string): Promise<void> {
  const questIds = await db<{ id: number }>("quests")
    .where("channel_id", channelId)
    .select("id");
  const ids = questIds.map((r) => r.id);
  if (ids.length === 0) return;
  await db.transaction(async (trx) => {
    await trx("quest_progress").whereIn("quest_id", ids).delete();
    await trx("quests").where("channel_id", channelId).delete();
  });
}

/**
 * Inserts a new quest into the database.
 *
 * @param channelId - The Discord channel ID
 * @param quest - Quest input (name, optional progress, optional parentQuestId)
 */
export async function addQuest(
  channelId: string,
  quest: AddQuestInput
): Promise<void> {
  await db.transaction(async (trx) => {
    const insertResult = await trx("quests").insert({
      channel_id: channelId,
      name: quest.name,
      completed: 0,
      prepared: quest.prepared ? 1 : 0,
      parent_quest_id: quest.parentQuestId
        ? parseInt(quest.parentQuestId, 10)
        : null,
    });

    const questId = (Array.isArray(insertResult)
      ? insertResult[0]
      : insertResult) as number;
    const progress = quest.progress ?? [];
    for (let i = 0; i < progress.length; i++) {
      await trx("quest_progress").insert({
        quest_id: questId,
        text: progress[i],
        sort_order: i,
      });
    }
  });
}
