import type { APIModalSubmission } from "discord-api-types/v10";
import type { Response } from "express";
import { ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { createQuest } from "../../controllers/questsController";
import {
  QUEST_ADD_NAME_INPUT_CUSTOM_ID,
  QUEST_ADD_PROGRESS_INPUT_CUSTOM_ID,
} from "../questModalIds";

/**
 * Handles submission of the quest add modal. Creates a new quest and sends the response.
 *
 * @param channelId - The Discord channel ID
 * @param data - Discord modal submission payload
 * @param res - Express response for sending the interaction response
 */
export async function handleQuestAddModalSubmit(
  channelId: string,
  data: APIModalSubmission,
  res: Response,
): Promise<void> {
  let name: string | null = null;
  let progress = "";

  for (const label of data.components) {
    if (label.type === ComponentType.Label && label.component) {
      const comp = label.component;
      if (
        comp.custom_id === QUEST_ADD_NAME_INPUT_CUSTOM_ID &&
        comp.type === ComponentType.TextInput &&
        comp.value
      ) {
        name = comp.value;
      } else if (
        comp.custom_id === QUEST_ADD_PROGRESS_INPUT_CUSTOM_ID &&
        comp.type === ComponentType.TextInput &&
        comp.value
      ) {
        progress = comp.value;
      }
    }
  }

  if (!name || !name.trim()) {
    res.send({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "Quest name is required. What adventure shall you undertake?",
      },
    });
    return;
  }

  const response = await createQuest(channelId, name.trim(), progress);
  res.send(response);
}
