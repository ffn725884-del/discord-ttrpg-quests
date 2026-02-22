import type { APIApplicationCommandInteraction } from "discord-api-types/v10";
import { Utils } from "discord-api-types/v10";
import type { Request, Response } from "express";
import { COMMAND_NAMES } from "../../commandDefinitions";
import { handleQuests } from "./questsApplicationCommand";

/**
 * Dispatches incoming application command interactions to the appropriate handler.
 * Handles the /quests command and returns 400 for invalid or unknown commands.
 *
 * @param req - Express request containing the Discord interaction payload
 * @param res - Express response for sending the result
 */
export async function handleApplicationCommand(
  req: Request<object, object, APIApplicationCommandInteraction>,
  res: Response,
): Promise<void> {
  switch (req.body.data.name) {
    case COMMAND_NAMES.QUESTS:
      if (Utils.isChatInputApplicationCommandInteraction(req.body)) {
        await handleQuests(req.body, res);
      } else {
        res.status(400).send({ error: "Invalid command" });
      }
      return;
    default:
      res.status(400).send({ error: "Invalid command" });
      return;
  }
}
