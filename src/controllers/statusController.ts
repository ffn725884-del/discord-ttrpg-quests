import { APIInteractionResponse } from "discord-api-types/v10";
import { isDatabaseUp } from "../dal/statusDAL";
import { buildStatusResponse } from "../presentation/statusResponseBuilder";

export interface StatusResponse {
  appUp: boolean;
  databaseConnected: boolean;
}

/**
 * Returns the application status including app health and database connectivity.
 *
 * @returns Status object with appUp and databaseConnected flags
 */
export async function getStatus(): Promise<StatusResponse> {
  const appUp = true;
  const databaseConnected = await isDatabaseUp();
  return { appUp, databaseConnected };
}

/**
 * Returns a Discord-formatted status response (ephemeral message with app/db status).
 *
 * @returns Discord API interaction response with status content
 */
export async function getStatusForDiscord(): Promise<APIInteractionResponse> {
  const status = await getStatus();
  return buildStatusResponse(status);
}
