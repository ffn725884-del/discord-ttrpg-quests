import express, { Router } from "express";
import jwt from "jsonwebtoken";
import { findApiKey } from "../dal/apiKeysDAL";
import { getGuildMember } from "../services/discordApi";
import { getAllQuests } from "../dal/questsDAL";
import { apiAuthMiddleware } from "../middleware/apiAuthMiddleware";

export const apiRouter = Router();

apiRouter.use(express.json());

apiRouter.post("/token", async (req, res) => {
  const { api_key } = req.body as { api_key?: unknown };
  if (typeof api_key !== "string" || !api_key) {
    res.status(400).json({ error: "api_key is required" });
    return;
  }

  const record = await findApiKey(api_key);
  if (!record) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  const member = await getGuildMember(record.guildId, record.userId);
  if (!member) {
    res.status(403).json({ error: "User is no longer a member of the guild" });
    return;
  }

  const secret = process.env.JWT_SECRET!;
  const token = jwt.sign(
    { userId: record.userId, guildId: record.guildId, channelId: record.channelId },
    secret,
    { expiresIn: "15m" },
  );

  res.json({ token });
});

apiRouter.get("/quests", apiAuthMiddleware, async (req, res) => {
  const { channelId } = req.apiToken!;
  const quests = await getAllQuests(channelId);
  res.json({ quests });
});
