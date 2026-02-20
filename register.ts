import "dotenv/config";

// Discord API constants (https://docs.discord.com/developers/interactions/application-commands)
const ApplicationCommandType = {
  CHAT_INPUT: 1,
  USER: 2,
  MESSAGE: 3,
  PRIMARY_ENTRY_POINT: 4,
} as const;

// Installation contexts (integration_types)
const IntegrationType = {
  GUILD_INSTALL: 0,
  USER_INSTALL: 1,
} as const;

// Interaction contexts
const InteractionContextType = {
  GUILD: 0,
  BOT_DM: 1,
  PRIVATE_CHANNEL: 2,
} as const;

async function installGlobalCommands(commands: unknown) {
  const appId = process.env.APP_ID;
  const res = await fetch(
    `https://discord.com/api/v10/applications/${appId}/commands`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent":
          "DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)",
      },
      body: JSON.stringify(commands),
    },
  );
  if (!res.ok) {
    const error = await res.json();
    console.error(error);
    throw new Error(`Failed to install global commands: ${error.message}`);
  }
  const data = await res.json();
  console.log(`Successfully installed ${data.length} global commands`);
}
const TEST_COMMAND = {
  name: "test",
  description: "Basic command",
  type: ApplicationCommandType.CHAT_INPUT,
  integration_types: [
    IntegrationType.GUILD_INSTALL,
    IntegrationType.USER_INSTALL,
  ],
  contexts: [
    InteractionContextType.GUILD,
    InteractionContextType.BOT_DM,
    InteractionContextType.PRIVATE_CHANNEL,
  ],
};

installGlobalCommands([TEST_COMMAND]);
