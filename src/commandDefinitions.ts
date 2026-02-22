import type {
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPutAPIApplicationCommandsJSONBody,
} from "discord-api-types/v10";
import {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  InteractionContextType,
  PermissionFlagsBits,
} from "discord-api-types/v10";

const integrationTypes = [
  ApplicationIntegrationType.GuildInstall,
  ApplicationIntegrationType.UserInstall,
] as const;

const contexts = [
  InteractionContextType.Guild,
  InteractionContextType.BotDM,
  InteractionContextType.PrivateChannel,
] as const;

/** Command names for routing (e.g. switch cases) and command definitions. */
export const COMMAND_NAMES = {
  QUESTS: "quests",
  GM: "gm",
} as const;

/** GM subcommand names for routing and command definition. */
export const GM_SUBCOMMANDS = {
  ASSIGN: "assign",
} as const;

/** Quest subcommand names for routing and command definition. */
export const QUEST_SUBCOMMANDS = {
  CURRENT: "current",
  ALL: "all",
  SHOW_COMPLETED: "show-completed",
  SHOWME: "showme",
  ADVANCE: "advance",
  ADD: "add",
  SUBQUEST: "subquest",
  PREPARE: "prepare",
  REVEAL: "reveal",
  DISCARD: "discard",
  COMPLETE: "complete",
  DELETE: "delete",
  CLEAR: "clear",
  SYSTEM_STATUS: "system-status",
} as const;

/** Showme subcommand names (ephemeral variants of current, all, completed). */
export const QUEST_SHOWME_SUBCOMMANDS = {
  CURRENT: "current",
  ALL: "all",
  COMPLETED: "completed",
} as const;

export const QUESTS_COMMAND: RESTPostAPIChatInputApplicationCommandsJSONBody = {
  name: COMMAND_NAMES.QUESTS,
  description: "Campaign quest log—track adventures, progress, and resolutions",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: QUEST_SUBCOMMANDS.CURRENT,
      description: "List active quests in your journal",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: QUEST_SUBCOMMANDS.ALL,
      description: "List all quests (active and completed)",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: QUEST_SUBCOMMANDS.SHOW_COMPLETED,
      description: "List completed adventures",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: QUEST_SUBCOMMANDS.SHOWME,
      description: "Show quests in ephemeral messages (visible only to you)",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: QUEST_SHOWME_SUBCOMMANDS.CURRENT,
          description: "List active quests (ephemeral)",
          type: ApplicationCommandOptionType.Subcommand,
        },
        {
          name: QUEST_SHOWME_SUBCOMMANDS.ALL,
          description: "List all quests (ephemeral)",
          type: ApplicationCommandOptionType.Subcommand,
        },
        {
          name: QUEST_SHOWME_SUBCOMMANDS.COMPLETED,
          description: "List completed adventures (ephemeral)",
          type: ApplicationCommandOptionType.Subcommand,
        },
      ],
    },
    {
      name: QUEST_SUBCOMMANDS.ADVANCE,
      description: "Log progress on an adventure",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: QUEST_SUBCOMMANDS.ADD,
      description: "Add a new quest to your campaign",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: QUEST_SUBCOMMANDS.SUBQUEST,
      description: "Add a subquest to an existing quest",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: QUEST_SUBCOMMANDS.PREPARE,
      description: "Prepare a quest for later reveal (GM only)",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: QUEST_SUBCOMMANDS.REVEAL,
      description: "Reveal a prepared quest to everyone (GM only)",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: QUEST_SUBCOMMANDS.DISCARD,
      description: "Discard a prepared quest (GM only)",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: QUEST_SUBCOMMANDS.COMPLETE,
      description: "Complete a quest with a resolution (e.g., We have slain the dragon)",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: QUEST_SUBCOMMANDS.DELETE,
      description: "Remove a quest from your journal",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: QUEST_SUBCOMMANDS.CLEAR,
      description: "Clear all quests from this channel's journal",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: QUEST_SUBCOMMANDS.SYSTEM_STATUS,
      description: "Internal app status (up, database connection)",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],
  integration_types: [...integrationTypes],
  contexts: [...contexts],
};

export const GM_COMMAND: RESTPostAPIChatInputApplicationCommandsJSONBody = {
  name: COMMAND_NAMES.GM,
  description: "Manage the Game Master (GM) for TTRPG campaigns",
  type: ApplicationCommandType.ChatInput,
  default_member_permissions: String(PermissionFlagsBits.Administrator),
  options: [
    {
      name: GM_SUBCOMMANDS.ASSIGN,
      description: "Assign the GM role to a user in this server",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],
  integration_types: [ApplicationIntegrationType.GuildInstall],
  contexts: [InteractionContextType.Guild],
};

/** Commands to register with Discord. */
export const COMMANDS_FOR_REGISTRATION: RESTPutAPIApplicationCommandsJSONBody = [
  QUESTS_COMMAND,
  GM_COMMAND,
];
