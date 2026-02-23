import type { NextFunction, Request, Response } from "express";
import { InteractionType } from "discord-api-types/v10";

interface ApplicationCommandOption {
  name: string;
  type?: number;
  value?: unknown;
  options?: ApplicationCommandOption[];
}

interface DiscordInteractionBody {
  type: InteractionType;
  data?: {
    name?: string;
    custom_id?: string;
    options?: ApplicationCommandOption[];
  };
  channel_id?: string;
}

const INTERACTION_TYPE_NAMES: Record<InteractionType, string> = {
  [InteractionType.Ping]: "Ping",
  [InteractionType.ApplicationCommand]: "ApplicationCommand",
  [InteractionType.MessageComponent]: "MessageComponent",
  [InteractionType.ApplicationCommandAutocomplete]: "ApplicationCommandAutocomplete",
  [InteractionType.ModalSubmit]: "ModalSubmit",
};

function timestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function buildApplicationCommandString(data: DiscordInteractionBody["data"]): string {
  if (!data?.name) return "";
  const parts: string[] = [data.name];
  let cursor = data.options;
  while (cursor?.length) {
    const next = cursor[0];
    if (next?.name) parts.push(next.name);
    cursor = next?.options;
  }
  return parts.join(" ");
}

/**
 * Express middleware that logs Discord interaction details when DEBUG=1.
 * Logs interaction type and type-specific data (command, modal ID, custom ID).
 * Avoids PII such as user and channel names. Calls next() unconditionally.
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
  const prefix = `[${timestamp()}]`;

  let detail = "";
  switch (body.type) {
    case InteractionType.ApplicationCommand: {
      const cmd = buildApplicationCommandString(body.data);
      detail = cmd ? ` command="${cmd}"` : "";
      break;
    }
    case InteractionType.ModalSubmit: {
      const modalId = body.data?.custom_id ?? "";
      detail = modalId ? ` modal_id="${modalId}"` : "";
      break;
    }
    case InteractionType.MessageComponent: {
      const customId = body.data?.custom_id ?? "";
      detail = customId ? ` custom_id="${customId}"` : "";
      break;
    }
  }

  console.log(`${prefix} New ${typeName} interaction${detail}`);

  next();
}
