import type { APIInteractionResponse } from "discord-api-types/v10";
import {
  getActiveQuests,
  getCompletedQuests,
  getAllQuests,
  getTopLevelActiveQuests,
  addQuestProgress,
  addQuest,
  completeQuest as completeQuestInDAL,
  deleteQuest as deleteQuestInDAL,
  getQuestCount,
  clearAllQuests as clearAllQuestsInDAL,
} from "../dal/questsDAL";
import {
  formatQuestList,
  formatAllQuestsList,
  formatCompletedQuestList,
} from "../presentation/questsFormat";
import { STRINGS } from "../presentation/questsStrings";
import {
  buildMessageResponse,
  buildAdvanceModalResponse,
  buildCompleteModalResponse,
  buildDeleteModalResponse,
  buildClearModalResponse,
  buildSubquestModalResponse,
  type QuestAdvanceModalConfig,
  type QuestCompleteModalConfig,
  type QuestSubquestModalConfig,
  type QuestClearModalConfig,
  type QuestDeleteModalConfig,
} from "../presentation/questsResponseBuilders";

export type {
  QuestAdvanceModalConfig,
  QuestCompleteModalConfig,
  QuestSubquestModalConfig,
  QuestClearModalConfig,
  QuestDeleteModalConfig,
};

/**
 * Returns a Discord interaction response listing active quests with completed subquests for a channel.
 *
 * @param channelId - The Discord channel ID
 * @returns Discord API interaction response with formatted quest list
 */
export async function getQuestsForShow(
  channelId: string,
): Promise<APIInteractionResponse> {
  const [quests, completedQuests] = await Promise.all([
    getActiveQuests(channelId),
    getCompletedQuests(channelId),
  ]);
  const content = formatQuestList(quests, completedQuests);
  return buildMessageResponse(content);
}

/**
 * Returns a Discord interaction response listing all quests (active and completed) for a channel.
 *
 * @param channelId - The Discord channel ID
 * @returns Discord API interaction response with formatted quest list
 */
export async function getQuestsForShowAll(
  channelId: string,
): Promise<APIInteractionResponse> {
  const activeQuests = await getActiveQuests(channelId);
  const completedQuests = await getCompletedQuests(channelId);
  const content = formatAllQuestsList(activeQuests, completedQuests);
  return buildMessageResponse(content);
}

/**
 * Returns a Discord interaction response listing only completed quests for a channel.
 *
 * @param channelId - The Discord channel ID
 * @returns Discord API interaction response with formatted completed quest list
 */
export async function getQuestsForShowCompleted(
  channelId: string,
): Promise<APIInteractionResponse> {
  const quests = await getCompletedQuests(channelId);
  const content = formatCompletedQuestList(quests);
  return buildMessageResponse(content);
}

/**
 * Returns a Discord modal for advancing (recording progress on) a quest.
 * Shows a message if no active quests exist.
 *
 * @param channelId - The Discord channel ID
 * @param modalConfig - Configuration for modal IDs (quest select, progress input)
 * @returns Discord API interaction response (modal or message)
 */
export async function getAdvanceModal(
  channelId: string,
  modalConfig: QuestAdvanceModalConfig,
): Promise<APIInteractionResponse> {
  const quests = await getActiveQuests(channelId);
  if (quests.length === 0) {
    return buildMessageResponse(STRINGS.noQuestsAvailable);
  }
  return buildAdvanceModalResponse(quests, modalConfig);
}

/**
 * Returns a Discord modal for completing a quest with a resolution.
 * Shows a message if no active quests exist.
 *
 * @param channelId - The Discord channel ID
 * @param modalConfig - Configuration for modal IDs (quest select, resolution input)
 * @returns Discord API interaction response (modal or message)
 */
export async function getCompleteModal(
  channelId: string,
  modalConfig: QuestCompleteModalConfig,
): Promise<APIInteractionResponse> {
  const quests = await getActiveQuests(channelId);
  if (quests.length === 0) {
    return buildMessageResponse(STRINGS.noQuestsToComplete);
  }
  return buildCompleteModalResponse(quests, modalConfig);
}

/**
 * Returns a Discord modal for selecting a quest to delete.
 * Shows a message if no quests exist.
 *
 * @param channelId - The Discord channel ID
 * @param modalConfig - Configuration for modal IDs (quest select)
 * @returns Discord API interaction response (modal or message)
 */
export async function getDeleteModal(
  channelId: string,
  modalConfig: QuestDeleteModalConfig,
): Promise<APIInteractionResponse> {
  const quests = await getAllQuests(channelId);
  if (quests.length === 0) {
    return buildMessageResponse(STRINGS.noQuestsToDelete);
  }
  return buildDeleteModalResponse(quests, modalConfig);
}

/**
 * Returns a Discord modal for confirming clearing all quests from a channel.
 * Shows a message if the quest log is empty.
 *
 * @param channelId - The Discord channel ID
 * @param modalConfig - Configuration for modal IDs (confirmation input)
 * @returns Discord API interaction response (modal or message)
 */
export async function getClearConfirmationModal(
  channelId: string,
  modalConfig: QuestClearModalConfig,
): Promise<APIInteractionResponse> {
  const count = await getQuestCount(channelId);
  if (count === 0) {
    return buildMessageResponse(STRINGS.questLogEmpty);
  }
  return buildClearModalResponse(count, modalConfig);
}

/**
 * Clears all quests from a channel and returns a confirmation message.
 *
 * @param channelId - The Discord channel ID
 * @returns Discord API interaction response with confirmation message
 */
export async function clearAllQuests(
  channelId: string,
): Promise<APIInteractionResponse> {
  const count = await getQuestCount(channelId);
  await clearAllQuestsInDAL(channelId);
  return buildMessageResponse(STRINGS.questsCleared(count));
}

/**
 * Returns a Discord modal for adding a subquest to an existing quest.
 * Shows a message if no top-level active quests exist.
 *
 * @param channelId - The Discord channel ID
 * @param modalConfig - Configuration for modal IDs (parent select, name, progress inputs)
 * @returns Discord API interaction response (modal or message)
 */
export async function getSubquestModal(
  channelId: string,
  modalConfig: QuestSubquestModalConfig,
): Promise<APIInteractionResponse> {
  const topLevelQuests = await getTopLevelActiveQuests(channelId);
  if (topLevelQuests.length === 0) {
    return buildMessageResponse(STRINGS.noTopLevelQuests);
  }
  return buildSubquestModalResponse(topLevelQuests, modalConfig);
}

/**
 * Creates a new top-level quest in a channel.
 *
 * @param channelId - The Discord channel ID
 * @param name - Quest name
 * @param progressText - Optional initial progress/details
 * @returns Discord API interaction response with confirmation message
 */
export async function createQuest(
  channelId: string,
  name: string,
  progressText: string,
): Promise<APIInteractionResponse> {
  const progress = progressText.trim() ? [progressText.trim()] : [];
  await addQuest(channelId, { name, progress });
  return buildMessageResponse(STRINGS.questAdded(name));
}

/**
 * Creates a new subquest under an existing quest.
 *
 * @param channelId - The Discord channel ID
 * @param parentQuestId - ID of the parent quest
 * @param name - Subquest name
 * @param progressText - Optional initial progress/details
 * @returns Discord API interaction response with confirmation message
 */
export async function createSubquest(
  channelId: string,
  parentQuestId: string,
  name: string,
  progressText: string,
): Promise<APIInteractionResponse> {
  const progress = progressText.trim() ? [progressText.trim()] : [];
  await addQuest(channelId, { name, progress, parentQuestId });
  return buildMessageResponse(STRINGS.subquestAdded(name));
}

/**
 * Records progress on an existing quest.
 *
 * @param channelId - The Discord channel ID
 * @param questId - ID of the quest
 * @param progressText - Progress text to add
 * @returns Discord API interaction response with success or error message
 */
export async function recordQuestProgress(
  channelId: string,
  questId: string,
  progressText: string,
): Promise<APIInteractionResponse> {
  const success = await addQuestProgress(channelId, questId, progressText);
  return buildMessageResponse(
    success ? STRINGS.adventureProgressLogged : STRINGS.questNotFound,
  );
}

/**
 * Marks a quest as completed with the given resolution.
 *
 * @param channelId - The Discord channel ID
 * @param questId - ID of the quest
 * @param resolutionText - Resolution text (e.g., how the quest ended)
 * @returns Discord API interaction response with success or error message
 */
export async function completeQuest(
  channelId: string,
  questId: string,
  resolutionText: string,
): Promise<APIInteractionResponse> {
  const success = await completeQuestInDAL(channelId, questId, resolutionText);
  return buildMessageResponse(
    success ? STRINGS.questCompleted : STRINGS.questNotFound,
  );
}

/**
 * Permanently deletes a quest and its subquests.
 *
 * @param channelId - The Discord channel ID
 * @param questId - ID of the quest to delete
 * @returns Discord API interaction response with success or error message
 */
export async function deleteQuest(
  channelId: string,
  questId: string,
): Promise<APIInteractionResponse> {
  const success = await deleteQuestInDAL(channelId, questId);
  return buildMessageResponse(
    success ? STRINGS.questRemoved : STRINGS.questNotFound,
  );
}
