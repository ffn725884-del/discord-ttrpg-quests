import "dotenv/config";
import express, { Request, Response } from "express";
import {
  verifyKeyMiddleware,
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
} from "discord-interactions";

const app = express();

const PORT = process.env.PORT || 3000;

app.post(
  "/interactions",
  verifyKeyMiddleware,
  async (req: Request, res: Response) => {
    const { type, data } = req.body;
    switch (type) {
      case InteractionType.PING:
        return res.send({ type: InteractionResponseType.PONG });
      case InteractionType.APPLICATION_COMMAND:
        const { name } = data;
        switch (name) {
          case "test":
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                components: [
                  {
                    type: MessageComponentTypes.TEXT_DISPLAY,
                    content: "Hello, world!",
                  },
                ],
              },
            });
          default:
            return res.status(400).send({ error: "Invalid command" });
        }
      default:
        return res.status(400).send({ error: "Invalid interaction type" });
    }
  },
);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
