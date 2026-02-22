import type { APIInteractionResponse } from "discord-api-types/v10";
import {
  InteractionResponseType,
  MessageFlags,
} from "discord-api-types/v10";

export interface StatusData {
  appUp: boolean;
  databaseConnected: boolean;
}

/**
 * Builds a Discord ephemeral message with app and database status.
 *
 * @param status - Status data (appUp, databaseConnected)
 * @returns Discord API interaction response (ephemeral message)
 */
export function buildStatusResponse(status: StatusData): APIInteractionResponse {
  const dbStatus = status.databaseConnected ? "Connected" : "Disconnected";
  const content = [
    "**Internal Status**",
    `• App: ${status.appUp ? "Up" : "Down"}`,
    `• Database: ${dbStatus}`,
  ].join("\n");

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content,
      flags: MessageFlags.Ephemeral,
    },
  };
}
