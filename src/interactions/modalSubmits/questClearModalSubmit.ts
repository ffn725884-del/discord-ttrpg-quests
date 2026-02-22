import type { APIModalSubmitInteraction } from "discord-api-types/v10";
import type { Response } from "express";
import { ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { clearAllQuests } from "../../controllers/questsController";
import { hasAdminPermission } from "../../utils/permissions";
import { buildPermissionDeniedResponse } from "../../presentation/permissionResponseBuilder";
import { QUEST_CLEAR_CONFIRM_INPUT_CUSTOM_ID } from "../questModalIds";

const CONFIRM_VALUE = "clear";

/**
 * Handles submission of the quest clear confirmation modal. Clears all quests if confirmed.
 * Requires Administrator permission in guild context.
 *
 * @param interaction - Discord modal submit interaction
 * @param res - Express response for sending the interaction response
 */
export async function handleQuestClearModalSubmit(
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

  let confirmValue: string | null = null;

  for (const row of data.components) {
    if (row.type === ComponentType.Label && row.component) {
      const comp = row.component;
      if (
        comp.custom_id === QUEST_CLEAR_CONFIRM_INPUT_CUSTOM_ID &&
        comp.type === ComponentType.TextInput &&
        comp.value
      ) {
        confirmValue = comp.value.trim().toLowerCase();
        break;
      }
    }
  }

  if (confirmValue !== CONFIRM_VALUE) {
    res.send({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: `You must type '${CONFIRM_VALUE}' to confirm. Your quest log remains unchanged.`,
      },
    });
    return;
  }

  const response = await clearAllQuests(channelId);
  res.send(response);
}
