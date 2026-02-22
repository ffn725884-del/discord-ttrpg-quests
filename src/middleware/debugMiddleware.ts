import type { NextFunction, Request, Response } from "express";
import { InteractionType } from "discord-api-types/v10";

interface DiscordInteractionBody {
  type: InteractionType;
  member?: { user: { username: string; global_name?: string | null } };
  user?: { username: string; global_name?: string | null };
  channel?: { id: string; name?: string | null };
  channel_id?: string;
}

const INTERACTION_TYPE_NAMES: Record<InteractionType, string> = {
  [InteractionType.Ping]: "Ping",
  [InteractionType.ApplicationCommand]: "ApplicationCommand",
  [InteractionType.MessageComponent]: "MessageComponent",
  [InteractionType.ApplicationCommandAutocomplete]: "ApplicationCommandAutocomplete",
  [InteractionType.ModalSubmit]: "ModalSubmit",
};

/**
 * Express middleware that logs Discord interaction details when DEBUG=1.
 * Logs interaction type, username, and channel. Calls next() unconditionally.
 *
 * @param req - Express request (with Discord interaction body)
 * @param _res - Express response (unused)
 * @param next - Next middleware function
 */
export function debugMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (process.env.DEBUG !== "1") {
    next();
    return;
  }

  const body = req.body as DiscordInteractionBody;
  const typeName =
    INTERACTION_TYPE_NAMES[body.type as InteractionType] ?? `Unknown(${body.type})`;

  const user = body.member?.user ?? body.user;
  const username = user
    ? user.global_name ?? user.username
    : "unknown";

  const channelName =
    body.channel?.name ?? body.channel_id ?? "unknown";

  console.log(
    `New ${typeName} interaction from user ${username} in channel ${channelName}`
  );

  next();
}
