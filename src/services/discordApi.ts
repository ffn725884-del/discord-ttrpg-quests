const DISCORD_API_BASE = "https://discord.com/api/v10";

function getAuthHeaders(): Record<string, string> {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    throw new Error("DISCORD_TOKEN is not set");
  }
  return {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  };
}

export interface DiscordApplication {
  id: string;
  name: string;
}

export interface DiscordRole {
  id: string;
  name: string;
}

interface DiscordApiErrorBody {
  message?: string;
  code?: number;
}

function createDiscordApiError(
  status: number,
  err: DiscordApiErrorBody,
  context: string,
): Error {
  if (err.code === 50013) {
    return new Error(
      `The bot doesn't have the required permissions. Ensure the bot has the **Manage Roles** permission and that its role is above the target role in the server's role hierarchy.`,
    );
  }
  return new Error(`Failed to ${context}: ${status} ${JSON.stringify(err)}`);
}

/**
 * Fetches the current application (bot) info.
 * @see https://discord.com/developers/resources/application#get-current-application
 */
export async function getCurrentApplication(): Promise<DiscordApplication> {
  const res = await fetch(`${DISCORD_API_BASE}/applications/@me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Failed to get application: ${res.status} ${JSON.stringify(err)}`,
    );
  }
  const data = (await res.json()) as DiscordApplication;
  return data;
}

/**
 * Lists all roles in a guild.
 * @see https://discord.com/developers/docs/resources/guild#get-guild-roles
 */
export async function getGuildRoles(
  guildId: string,
): Promise<DiscordRole[]> {
  const res = await fetch(
    `${DISCORD_API_BASE}/guilds/${guildId}/roles`,
    { headers: getAuthHeaders() },
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as DiscordApiErrorBody;
    throw createDiscordApiError(res.status, err, "get guild roles");
  }
  const data = (await res.json()) as DiscordRole[];
  return data;
}

/**
 * Creates a role in a guild.
 * @see https://discord.com/developers/docs/resources/guild#create-guild-role
 */
export async function createGuildRole(
  guildId: string,
  name: string,
): Promise<DiscordRole> {
  const res = await fetch(
    `${DISCORD_API_BASE}/guilds/${guildId}/roles`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    },
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as DiscordApiErrorBody;
    throw createDiscordApiError(res.status, err, "create role");
  }
  const data = (await res.json()) as DiscordRole;
  return data;
}

/**
 * Registers global application commands with Discord.
 * @see https://discord.com/developers/interactions/application-commands#bulk-overwrite-global-application-commands
 */
export async function installGlobalCommands(
  appId: string,
  commands: unknown,
): Promise<unknown[]> {
  const res = await fetch(
    `${DISCORD_API_BASE}/applications/${appId}/commands`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(commands),
    },
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(
      `Failed to install global commands: ${err.message ?? res.status}`,
    );
  }
  const data = (await res.json()) as unknown[];
  return data;
}

/**
 * Adds a role to a guild member.
 * @see https://discord.com/developers/docs/resources/guild#add-guild-member-role
 */
export async function addGuildMemberRole(
  guildId: string,
  userId: string,
  roleId: string,
): Promise<void> {
  const res = await fetch(
    `${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    },
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as DiscordApiErrorBody;
    throw createDiscordApiError(res.status, err, "add role to member");
  }
}
