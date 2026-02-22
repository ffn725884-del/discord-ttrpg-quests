import type { APIModalSubmitInteraction } from "discord-api-types/v10";
import type { Response } from "express";
import { ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { discardPreparedQuest } from "../../controllers/questsController";
import { getGmRoleId } from "../../dal/gmDAL";
import { memberHasRole } from "../../utils/permissions";
import { buildGmPermissionDeniedResponse } from "../../presentation/permissionResponseBuilder";
import { QUEST_DISCARD_SELECT_CUSTOM_ID } from "../questModalIds";

/**
 * Handles submission of the quest discard modal. Permanently deletes a prepared quest.
 * Requires GM role. Re-verifies GM on submit (defense in depth).
 *
 * @param interaction - Discord modal submit interaction
 * @param res - Express response for sending the interaction response
 */
export async function handleQuestDiscardModalSubmit(
  interaction: APIModalSubmitInteraction,
  res: Response,
): Promise<void> {
  if (!interaction.guild_id) {
    res.send({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "This command must be used in a server.",
        flags: MessageFlags.Ephemeral,
      },
    });
    return;
  }

  const roleId = await getGmRoleId(interaction.guild_id);
  if (!memberHasRole(interaction, roleId)) {
    res.send(buildGmPermissionDeniedResponse(roleId !== null));
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
        comp.custom_id === QUEST_DISCARD_SELECT_CUSTOM_ID &&
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
        flags: MessageFlags.Ephemeral,
      },
    });
    return;
  }

  const response = await discardPreparedQuest(channelId, questId);
  res.send(response);
}
