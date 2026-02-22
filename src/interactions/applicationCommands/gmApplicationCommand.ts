import type { APIChatInputApplicationCommandInteraction } from "discord-api-types/v10";
import { InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import type { Response } from "express";
import { GM_SUBCOMMANDS } from "../../commandDefinitions";
import { hasAdminPermission } from "../../utils/permissions";
import { buildPermissionDeniedResponse } from "../../presentation/permissionResponseBuilder";
import { getGmAssignUserSelect } from "../../controllers/gmController";

/**
 * Handles the /gm slash command by delegating to the appropriate subcommand handler.
 * All GM subcommands require Administrator permission.
 */
export async function handleGm(
  interaction: APIChatInputApplicationCommandInteraction,
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
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      },
    });
    return;
  }

  const subcommand = interaction.data.options?.[0]?.name;
  switch (subcommand) {
    case GM_SUBCOMMANDS.ASSIGN: {
      try {
        const response = await getGmAssignUserSelect(guildId);
        res.send(response);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to set up GM assignment.";
        res.send({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: `Error: ${message}`,
            flags: MessageFlags.Ephemeral,
          },
        });
      }
      return;
    }
    default:
      res.send({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "Unknown subcommand. Use /gm assign.",
          flags: MessageFlags.Ephemeral,
        },
      });
  }
}
