import type { APIMessageComponentInteraction } from "discord-api-types/v10";
import { ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import type { Response } from "express";
import { hasAdminPermission } from "../../utils/permissions";
import { buildPermissionDeniedResponse } from "../../presentation/permissionResponseBuilder";
import { assignGmRoleToUser } from "../../controllers/gmController";
import { GM_ASSIGN_USER_SELECT_CUSTOM_ID } from "../gmComponentIds";

/**
 * Handles the GM assign User Select component interaction.
 * Assigns the GM role to the selected user.
 */
export async function handleGmAssignUserSelect(
  interaction: APIMessageComponentInteraction,
  res: Response,
): Promise<void> {
  if (!hasAdminPermission(interaction)) {
    res.send(buildPermissionDeniedResponse());
    return;
  }

  const guildId = interaction.guild_id;
  if (!guildId) {
    res.send({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "This can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      },
    });
    return;
  }

  const data = interaction.data;
  if (data.component_type !== ComponentType.UserSelect) {
    res.status(400).send({ error: "Expected UserSelect component" });
    return;
  }

  const userId = data.values?.[0];
  if (!userId) {
    res.send({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "No user selected. Please select a user.",
        flags: MessageFlags.Ephemeral,
      },
    });
    return;
  }

  const response = await assignGmRoleToUser(guildId, userId);
  res.send(response);
}
