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
