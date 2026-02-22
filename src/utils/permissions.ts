import type { APIInteraction } from "discord-api-types/v10";
import { PermissionFlagsBits } from "discord-api-types/v10";

/**
 * Returns true if the user is allowed to perform admin-only actions (delete quest, clear log).
 * In guild context: requires Administrator permission.
 * In BOT_DM or other non-guild contexts: always allowed (no permission check).
 *
 * @param interaction - Discord interaction (application command or modal submit)
 * @returns true if the action is allowed
 */
export function hasAdminPermission(interaction: APIInteraction): boolean {
  const member = interaction.member;
  if (!member || !("permissions" in member)) {
    return true;
  }

  const permissions = (member as { permissions: string }).permissions;
  const permsBigInt = BigInt(permissions);
  return (
    (permsBigInt & PermissionFlagsBits.Administrator) ===
    PermissionFlagsBits.Administrator
  );
}
