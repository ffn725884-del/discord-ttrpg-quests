import type { APIInteractionResponse } from "discord-api-types/v10";
import { ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import {
  getCurrentApplication,
  getGuildRoles,
  createGuildRole,
  addGuildMemberRole,
} from "../services/discordApi";
import { getGmRoleId, saveGmRoleMapping } from "../dal/gmDAL";
import { GM_ASSIGN_USER_SELECT_CUSTOM_ID } from "../interactions/gmComponentIds";

/**
 * Handles /gm assign: creates or finds the GM role, saves mapping, and returns
 * a message with a User Select for the administrator to choose the GM.
 */
export async function getGmAssignUserSelect(
  guildId: string,
): Promise<APIInteractionResponse> {
  const app = await getCurrentApplication();
  const roleName = `${app.name}-GM`;

  let roleId = await getGmRoleId(guildId);

  if (!roleId) {
    const existingRoles = await getGuildRoles(guildId);
    const existing = existingRoles.find(
      (r) => r.name.toLowerCase() === roleName.toLowerCase(),
    );
    if (existing) {
      roleId = existing.id;
    } else {
      const newRole = await createGuildRole(guildId, roleName);
      roleId = newRole.id;
    }
    await saveGmRoleMapping(guildId, roleId);
  }

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: `Select the user to assign as GM. The role **${roleName}** will be assigned to them.`,
      flags: MessageFlags.Ephemeral,
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.UserSelect,
              custom_id: GM_ASSIGN_USER_SELECT_CUSTOM_ID,
              placeholder: "Select GM user",
              min_values: 1,
              max_values: 1,
            },
          ],
        },
      ],
    },
  };
}

/**
 * Handles the User Select interaction: assigns the GM role to the selected user.
 */
export async function assignGmRoleToUser(
  guildId: string,
  userId: string,
): Promise<APIInteractionResponse> {
  const roleId = await getGmRoleId(guildId);
  if (!roleId) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content:
          "GM role is not configured for this server. Run `/gm assign` first to set it up.",
        flags: MessageFlags.Ephemeral,
      },
    };
  }

  try {
    await addGuildMemberRole(guildId, userId, roleId);
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "GM role assigned successfully.",
        flags: MessageFlags.Ephemeral,
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to assign GM role.";
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: `Error: ${message}`,
        flags: MessageFlags.Ephemeral,
      },
    };
  }
}
