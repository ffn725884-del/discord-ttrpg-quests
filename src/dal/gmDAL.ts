import { db } from "../db/index";

/**
 * Saves the GM role mapping for a guild.
 *
 * @param guildId - Discord guild ID
 * @param roleId - Discord role ID of the GM role
 */
export async function saveGmRoleMapping(
  guildId: string,
  roleId: string,
): Promise<void> {
  await db("gm_roles")
    .insert({ guild_id: guildId, role_id: roleId })
    .onConflict("guild_id")
    .merge({ role_id: roleId });
}

/**
 * Gets the GM role ID for a guild, or null if not configured.
 *
 * @param guildId - Discord guild ID
 * @returns The GM role ID or null
 */
export async function getGmRoleId(guildId: string): Promise<string | null> {
  const row = await db<{ role_id: string }>("gm_roles")
    .where("guild_id", guildId)
    .select("role_id")
    .first();
  return row?.role_id ?? null;
}
