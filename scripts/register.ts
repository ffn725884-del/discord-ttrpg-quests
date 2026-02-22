import "dotenv/config";
import { COMMANDS_FOR_REGISTRATION } from "../src/commandDefinitions";
import { installGlobalCommands } from "../src/services/discordApi";

async function register(): Promise<void> {
  const appId = process.env.APP_ID;
  if (!appId) {
    throw new Error("APP_ID is not set");
  }
  const commands = await installGlobalCommands(appId, COMMANDS_FOR_REGISTRATION);
  console.log(`Successfully installed ${commands.length} global commands`);
}

register();
