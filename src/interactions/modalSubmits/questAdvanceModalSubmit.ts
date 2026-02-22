import type { APIModalSubmission } from "discord-api-types/v10";
import type { Response } from "express";
import { ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { recordQuestProgress } from "../../controllers/questsController";
import {
  QUEST_ADVANCE_SELECT_CUSTOM_ID,
  QUEST_ADVANCE_PROGRESS_INPUT_CUSTOM_ID,
} from "../questModalIds";

/**
 * Handles submission of the quest advance modal. Records progress on the selected quest.
 *
 * @param channelId - The Discord channel ID
 * @param data - Discord modal submission payload
 * @param res - Express response for sending the interaction response
 */
export async function handleQuestAdvanceModalSubmit(
  channelId: string,
  data: APIModalSubmission,
  res: Response,
): Promise<void> {
  let questId: string | null = null;
  let progressText: string | null = null;

  for (const label of data.components) {
    if (label.type === ComponentType.Label && label.component) {
      const comp = label.component;
      if (
        comp.custom_id === QUEST_ADVANCE_SELECT_CUSTOM_ID &&
        comp.type === ComponentType.StringSelect &&
        comp.values?.[0]
      ) {
        questId = comp.values[0];
      } else if (
        comp.custom_id === QUEST_ADVANCE_PROGRESS_INPUT_CUSTOM_ID &&
        comp.type === ComponentType.TextInput &&
        comp.value
      ) {
        progressText = comp.value;
      }
    }
  }

  if (!questId || !progressText) {
    res.send({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content:
          "Missing quest selection or progress text. Please try again.",
      },
    });
    return;
  }

  const response = await recordQuestProgress(channelId, questId, progressText);
  res.send(response);
}
