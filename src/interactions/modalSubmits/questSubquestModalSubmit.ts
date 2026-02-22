import type { APIModalSubmission } from "discord-api-types/v10";
import type { Response } from "express";
import { ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { createSubquest } from "../../controllers/questsController";
import {
  QUEST_SUBQUEST_PARENT_SELECT_CUSTOM_ID,
  QUEST_SUBQUEST_NAME_INPUT_CUSTOM_ID,
  QUEST_SUBQUEST_PROGRESS_INPUT_CUSTOM_ID,
} from "../questModalIds";

/**
 * Handles submission of the subquest modal. Creates a new subquest under the selected parent.
 *
 * @param channelId - The Discord channel ID
 * @param data - Discord modal submission payload
 * @param res - Express response for sending the interaction response
 */
export async function handleQuestSubquestModalSubmit(
  channelId: string,
  data: APIModalSubmission,
  res: Response,
): Promise<void> {
  let parentQuestId: string | null = null;
  let name: string | null = null;
  let progress = "";

  for (const label of data.components) {
    if (label.type === ComponentType.Label && label.component) {
      const comp = label.component;
      if (
        comp.custom_id === QUEST_SUBQUEST_PARENT_SELECT_CUSTOM_ID &&
        comp.type === ComponentType.StringSelect &&
        comp.values?.[0]
      ) {
        parentQuestId = comp.values[0];
      } else if (
        comp.custom_id === QUEST_SUBQUEST_NAME_INPUT_CUSTOM_ID &&
        comp.type === ComponentType.TextInput &&
        comp.value
      ) {
        name = comp.value;
      } else if (
        comp.custom_id === QUEST_SUBQUEST_PROGRESS_INPUT_CUSTOM_ID &&
        comp.type === ComponentType.TextInput &&
        comp.value
      ) {
        progress = comp.value;
      }
    }
  }

  if (!parentQuestId || !name?.trim()) {
    res.send({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content:
          "Parent quest and subquest name are required. Please try again.",
      },
    });
    return;
  }

  const response = await createSubquest(
    channelId,
    parentQuestId,
    name.trim(),
    progress
  );
  res.send(response);
}
