import "dotenv/config";
import express, { Request, Response } from "express";
import { verifyKeyMiddleware } from "discord-interactions";
import {
  InteractionType,
  InteractionResponseType,
} from "discord-api-types/v10";
import { handleApplicationCommand } from "./interactions/applicationCommands";
import { handleModalSubmit } from "./interactions/modalSubmits";
import { handleMessageComponent } from "./interactions/messageComponents";
import { initSchema } from "./db/index";
import { debugMiddleware } from "./middleware/debugMiddleware";

const app = express();

const PORT = process.env.PORT || 3000;

app.post(
  "/interactions",
  verifyKeyMiddleware(process.env.PUBLIC_KEY!),
  debugMiddleware,
  async (req: Request, res: Response) => {
    const { type } = req.body;
    switch (type) {
      case InteractionType.Ping:
        return res.send({ type: InteractionResponseType.Pong });
      case InteractionType.ApplicationCommand:
        return await handleApplicationCommand(req, res);
      case InteractionType.ModalSubmit:
        return await handleModalSubmit(req, res);
      case InteractionType.MessageComponent:
        return await handleMessageComponent(req, res);
      default:
        return res.status(400).send({ error: "Invalid interaction type" });
    }
  },
);

async function start(): Promise<void> {
  await initSchema();
  app.listen(PORT, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server is running on port ${PORT}`);
  });
}

start();
