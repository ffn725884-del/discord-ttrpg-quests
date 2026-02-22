import "dotenv/config";
import { COMMANDS_FOR_REGISTRATION } from "../src/commandDefinitions";

async function installGlobalCommands(commands: unknown): Promise<void> {
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

installGlobalCommands(COMMANDS_FOR_REGISTRATION);
