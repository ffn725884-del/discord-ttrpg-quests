import type { APIModalSubmitInteraction } from "discord-api-types/v10";
import type { Response } from "express";
import { ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { createPreparedQuest } from "../../controllers/questsController";
import { getGmRoleId } from "../../dal/gmDAL";
import { memberHasRole } from "../../utils/permissions";
import { buildGmPermissionDeniedResponse } from "../../presentation/permissionResponseBuilder";
import {
  QUEST_PREPARE_PARENT_SELECT_CUSTOM_ID,
  QUEST_PREPARE_NAME_INPUT_CUSTOM_ID,
  QUEST_PREPARE_PROGRESS_INPUT_CUSTOM_ID,
} from "../questModalIds";

/**
 * Handles submission of the quest prepare modal. Creates a prepared quest (hidden until revealed).
 * Requires GM role. Re-verifies GM on submit (defense in depth).
 *
 * @param interaction - Discord modal submit interaction
 * @param res - Express response for sending the interaction response
 */
export async function handleQuestPrepareModalSubmit(
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

  let parentQuestId: string | null = null;
  let name: string | null = null;
  let progress = "";

  for (const label of data.components) {
    if (label.type === ComponentType.Label && label.component) {
      const comp = label.component;
      if (
        comp.custom_id === QUEST_PREPARE_PARENT_SELECT_CUSTOM_ID &&
        comp.type === ComponentType.StringSelect &&
        comp.values?.[0]
      ) {
        const val = comp.values[0];
        if (val && val !== "" && val !== "none") {
          parentQuestId = val;
        }
      } else if (
        comp.custom_id === QUEST_PREPARE_NAME_INPUT_CUSTOM_ID &&
        comp.type === ComponentType.TextInput &&
        comp.value
      ) {
        name = comp.value;
      } else if (
        comp.custom_id === QUEST_PREPARE_PROGRESS_INPUT_CUSTOM_ID &&
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
        content: "Quest name is required. Please try again.",
        flags: MessageFlags.Ephemeral,
      },
    });
    return;
  }

  const response = await createPreparedQuest(
    channelId,
    name.trim(),
    progress,
    parentQuestId ?? undefined,
  );
  res.send(response);
}
