import type { APIModalSubmission } from "discord-api-types/v10";
import type { Response } from "express";
import { ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { completeQuest } from "../../controllers/questsController";
import {
  QUEST_COMPLETE_SELECT_CUSTOM_ID,
  QUEST_COMPLETE_RESOLUTION_INPUT_CUSTOM_ID,
} from "../questModalIds";

/**
 * Handles submission of the quest complete modal. Marks the selected quest as completed.
 *
 * @param channelId - The Discord channel ID
 * @param data - Discord modal submission payload
 * @param res - Express response for sending the interaction response
 */
export async function handleQuestCompleteModalSubmit(
  channelId: string,
  data: APIModalSubmission,
  res: Response,
): Promise<void> {
  let questId: string | null = null;
  let resolutionText: string | null = null;

  for (const label of data.components) {
    if (label.type === ComponentType.Label && label.component) {
      const comp = label.component;
      if (
        comp.custom_id === QUEST_COMPLETE_SELECT_CUSTOM_ID &&
        comp.type === ComponentType.StringSelect &&
        comp.values?.[0]
      ) {
        questId = comp.values[0];
      } else if (
        comp.custom_id === QUEST_COMPLETE_RESOLUTION_INPUT_CUSTOM_ID &&
        comp.type === ComponentType.TextInput &&
        comp.value?.trim()
      ) {
        resolutionText = comp.value.trim();
      }
    }
  }

  if (!questId || !resolutionText) {
    res.send({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content:
          "Missing quest selection or resolution text. Please try again.",
      },
    });
    return;
  }

  const response = await completeQuest(channelId, questId, resolutionText);
  res.send(response);
}
