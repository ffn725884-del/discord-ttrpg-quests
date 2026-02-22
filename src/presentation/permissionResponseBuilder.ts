import type { APIInteractionResponse } from "discord-api-types/v10";
import {
  InteractionResponseType,
  MessageFlags,
} from "discord-api-types/v10";

/**
 * Builds an ephemeral error response for permission denied.
 *
 * @param message - Optional custom message (default: "You need the Administrator permission to do that.")
 * @returns Discord API interaction response
 */
export function buildPermissionDeniedResponse(
  message = "You need the Administrator permission to do that.",
): APIInteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: message,
      flags: MessageFlags.Ephemeral,
    },
  };
}

/**
 * Builds an ephemeral response for GM-only commands when the user lacks the GM role.
 *
 * @param roleConfigured - Whether the GM role is set up for the guild (in gm_roles)
 * @returns Discord API interaction response
 */
export function buildGmPermissionDeniedResponse(
  roleConfigured: boolean,
): APIInteractionResponse {
  const message = roleConfigured
    ? "This command is for GMs only."
    : "The GM role is not set up for this server. Use `/gm assign` to create and assign it.";
  return buildPermissionDeniedResponse(message);
}
