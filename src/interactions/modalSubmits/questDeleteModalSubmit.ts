import type { APIModalSubmitInteraction } from "discord-api-types/v10";
import type { Response } from "express";
import { ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { deleteQuest } from "../../controllers/questsController";
import { hasAdminPermission } from "../../utils/permissions";
import { buildPermissionDeniedResponse } from "../../presentation/permissionResponseBuilder";
import { QUEST_DELETE_SELECT_CUSTOM_ID } from "../questModalIds";

/**
 * Handles submission of the quest delete modal. Permanently deletes the selected quest.
 * Requires Administrator permission in guild context.
 *
 * @param interaction - Discord modal submit interaction
 * @param res - Express response for sending the interaction response
 */
export async function handleQuestDeleteModalSubmit(
  interaction: APIModalSubmitInteraction,
  res: Response,
): Promise<void> {
  if (!hasAdminPermission(interaction)) {
    res.send(buildPermissionDeniedResponse());
    return;
  }

  const channelId =
    (interaction.channel_id ?? interaction.channel?.id) as string;
  const data = interaction.data;

  let questId: string | null = null;

  for (const label of data.components) {
    if (label.type === ComponentType.Label && label.component) {
      const comp = label.component;
      if (
        comp.custom_id === QUEST_DELETE_SELECT_CUSTOM_ID &&
        comp.type === ComponentType.StringSelect &&
        comp.values?.[0]
      ) {
        questId = comp.values[0];
        break;
      }
    }
  }

  if (!questId) {
    res.send({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "Missing quest selection. Please try again.",
      },
    });
    return;
  }

  const response = await deleteQuest(channelId, questId);
  res.send(response);
}
