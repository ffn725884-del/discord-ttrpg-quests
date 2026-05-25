import type { APIChatInputApplicationCommandInteraction } from "discord-api-types/v10";
import type { Response } from "express";
import {
  ApplicationCommandOptionType,
  InteractionResponseType,
  MessageFlags,
} from "discord-api-types/v10";
import {
  QUESTS_COMMAND,
  QUEST_SUBCOMMANDS,
  QUEST_SHOWME_SUBCOMMANDS,
} from "../../commandDefinitions";
import { generateApiKey, upsertApiKey } from "../../dal/apiKeysDAL";
import { hasAdminPermission, memberHasRole } from "../../utils/permissions";
import {
  buildPermissionDeniedResponse,
  buildGmPermissionDeniedResponse,
} from "../../presentation/permissionResponseBuilder";
import { getGmRoleId } from "../../dal/gmDAL";
import {
  getQuestsForShow,
  getQuestsForShowAll,
  getQuestsForShowCompleted,
  getAdvanceModal,
  getSubquestModal,
  getPrepareModal,
  getRevealModal,
  getDiscardModal,
  getCompleteModal,
  getDeleteModal,
  getClearConfirmationModal,
} from "../../controllers/questsController";
import { buildAddModalResponse } from "../../presentation/questsResponseBuilders";
import { getStatusForDiscord } from "../../controllers/statusController";
import {
  QUEST_ADD_MODAL_ID,
  QUEST_ADD_NAME_INPUT_CUSTOM_ID,
  QUEST_ADD_PROGRESS_INPUT_CUSTOM_ID,
  QUEST_ADVANCE_MODAL_ID,
  QUEST_ADVANCE_SELECT_CUSTOM_ID,
  QUEST_ADVANCE_PROGRESS_INPUT_CUSTOM_ID,
  QUEST_COMPLETE_MODAL_ID,
  QUEST_COMPLETE_SELECT_CUSTOM_ID,
  QUEST_COMPLETE_RESOLUTION_INPUT_CUSTOM_ID,
  QUEST_SUBQUEST_MODAL_ID,
  QUEST_SUBQUEST_PARENT_SELECT_CUSTOM_ID,
  QUEST_SUBQUEST_NAME_INPUT_CUSTOM_ID,
  QUEST_SUBQUEST_PROGRESS_INPUT_CUSTOM_ID,
  QUEST_CLEAR_MODAL_ID,
  QUEST_CLEAR_CONFIRM_INPUT_CUSTOM_ID,
  QUEST_DELETE_MODAL_ID,
  QUEST_DELETE_SELECT_CUSTOM_ID,
  QUEST_PREPARE_MODAL_ID,
  QUEST_PREPARE_PARENT_SELECT_CUSTOM_ID,
  QUEST_PREPARE_NAME_INPUT_CUSTOM_ID,
  QUEST_PREPARE_PROGRESS_INPUT_CUSTOM_ID,
  QUEST_REVEAL_MODAL_ID,
  QUEST_REVEAL_SELECT_CUSTOM_ID,
  QUEST_DISCARD_MODAL_ID,
  QUEST_DISCARD_SELECT_CUSTOM_ID,
} from "../questModalIds";

function getQuestsSubcommandHelpText(): string {
  const options = QUESTS_COMMAND.options ?? [];
  const parts = options.map((o) => `/quests ${o.name}`);
  if (parts.length > 1) {
    parts[parts.length - 1] = `or ${parts[parts.length - 1]}`;
  }
  return `Unknown subcommand. Use ${parts.join(", ")}.`;
}

/**
 * Handles the /quests slash command by delegating to the appropriate subcommand handler.
 * Sends the response directly to the Express response object.
 *
 * @param interaction - The Discord chat input application command interaction
 * @param res - Express response object to send the interaction response
 */
export async function handleQuests(
  interaction: APIChatInputApplicationCommandInteraction,
  res: Response,
): Promise<void> {
  const channelId = interaction.channel.id;
  const topLevelOption = interaction.data.options?.[0];
  const subcommand = topLevelOption?.name;
  const nestedSubcommand =
    topLevelOption?.type === ApplicationCommandOptionType.SubcommandGroup
      ? topLevelOption.options?.[0]?.name
      : undefined;

  switch (subcommand) {
    case QUEST_SUBCOMMANDS.CURRENT: {
      const response = await getQuestsForShow(channelId);
      res.send(response);
      return;
    }
    case QUEST_SUBCOMMANDS.ALL: {
      const response = await getQuestsForShowAll(channelId);
      res.send(response);
      return;
    }
    case QUEST_SUBCOMMANDS.SHOW_COMPLETED: {
      const response = await getQuestsForShowCompleted(channelId);
      res.send(response);
      return;
    }
    case QUEST_SUBCOMMANDS.SHOWME: {
      switch (nestedSubcommand) {
        case QUEST_SHOWME_SUBCOMMANDS.CURRENT: {
          const response = await getQuestsForShow(channelId, true);
          res.send(response);
          return;
        }
        case QUEST_SHOWME_SUBCOMMANDS.ALL: {
          const response = await getQuestsForShowAll(channelId, true);
          res.send(response);
          return;
        }
        case QUEST_SHOWME_SUBCOMMANDS.COMPLETED: {
          const response = await getQuestsForShowCompleted(channelId, true);
          res.send(response);
          return;
        }
        default:
          res.send({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: `Unknown showme subcommand. Use \`/quests showme current\`, \`/quests showme all\`, or \`/quests showme completed\`.`,
              flags: MessageFlags.Ephemeral,
            },
          });
          return;
      }
    }
    case QUEST_SUBCOMMANDS.ADVANCE: {
      const response = await getAdvanceModal(channelId, {
        modalId: QUEST_ADVANCE_MODAL_ID,
        questSelectId: QUEST_ADVANCE_SELECT_CUSTOM_ID,
        progressInputId: QUEST_ADVANCE_PROGRESS_INPUT_CUSTOM_ID,
      });
      res.send(response);
      return;
    }
    case QUEST_SUBCOMMANDS.ADD: {
      const response = buildAddModalResponse({
        modalId: QUEST_ADD_MODAL_ID,
        nameInputId: QUEST_ADD_NAME_INPUT_CUSTOM_ID,
        progressInputId: QUEST_ADD_PROGRESS_INPUT_CUSTOM_ID,
      });
      res.send(response);
      return;
    }
    case QUEST_SUBCOMMANDS.SUBQUEST: {
      const response = await getSubquestModal(channelId, {
        modalId: QUEST_SUBQUEST_MODAL_ID,
        parentQuestSelectId: QUEST_SUBQUEST_PARENT_SELECT_CUSTOM_ID,
        nameInputId: QUEST_SUBQUEST_NAME_INPUT_CUSTOM_ID,
        progressInputId: QUEST_SUBQUEST_PROGRESS_INPUT_CUSTOM_ID,
      });
      res.send(response);
      return;
    }
    case QUEST_SUBCOMMANDS.PREPARE:
    case QUEST_SUBCOMMANDS.REVEAL:
    case QUEST_SUBCOMMANDS.DISCARD: {
      if (!interaction.guild_id) {
        res.send({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: "This command must be used in a server.",
            flags: MessageFlags.Ephemeral,
          },
        });
        return;
      }
      const roleId = await getGmRoleId(interaction.guild_id);
      if (!memberHasRole(interaction, roleId)) {
        res.send(buildGmPermissionDeniedResponse(roleId !== null));
        return;
      }
      if (subcommand === QUEST_SUBCOMMANDS.PREPARE) {
        const response = await getPrepareModal(channelId, {
          modalId: QUEST_PREPARE_MODAL_ID,
          parentQuestSelectId: QUEST_PREPARE_PARENT_SELECT_CUSTOM_ID,
          nameInputId: QUEST_PREPARE_NAME_INPUT_CUSTOM_ID,
          progressInputId: QUEST_PREPARE_PROGRESS_INPUT_CUSTOM_ID,
        });
        res.send(response);
      } else if (subcommand === QUEST_SUBCOMMANDS.REVEAL) {
        const response = await getRevealModal(channelId, {
          modalId: QUEST_REVEAL_MODAL_ID,
          questSelectId: QUEST_REVEAL_SELECT_CUSTOM_ID,
        });
        res.send(response);
      } else {
        const response = await getDiscardModal(channelId, {
          modalId: QUEST_DISCARD_MODAL_ID,
          questSelectId: QUEST_DISCARD_SELECT_CUSTOM_ID,
        });
        res.send(response);
      }
      return;
    }
    case QUEST_SUBCOMMANDS.COMPLETE: {
      const response = await getCompleteModal(channelId, {
        modalId: QUEST_COMPLETE_MODAL_ID,
        questSelectId: QUEST_COMPLETE_SELECT_CUSTOM_ID,
        resolutionInputId: QUEST_COMPLETE_RESOLUTION_INPUT_CUSTOM_ID,
      });
      res.send(response);
      return;
    }
    case QUEST_SUBCOMMANDS.DELETE: {
      if (!hasAdminPermission(interaction)) {
        res.send(buildPermissionDeniedResponse());
        return;
      }
      const response = await getDeleteModal(channelId, {
        modalId: QUEST_DELETE_MODAL_ID,
        questSelectId: QUEST_DELETE_SELECT_CUSTOM_ID,
      });
      res.send(response);
      return;
    }
    case QUEST_SUBCOMMANDS.CLEAR: {
      if (!hasAdminPermission(interaction)) {
        res.send(buildPermissionDeniedResponse());
        return;
      }
      const response = await getClearConfirmationModal(channelId, {
        modalId: QUEST_CLEAR_MODAL_ID,
        confirmInputId: QUEST_CLEAR_CONFIRM_INPUT_CUSTOM_ID,
      });
      res.send(response);
      return;
    }
    case QUEST_SUBCOMMANDS.SYSTEM_STATUS: {
      const response = await getStatusForDiscord();
      res.send(response);
      return;
    }
    case QUEST_SUBCOMMANDS.API_KEY: {
      if (!interaction.guild_id) {
        res.send({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: "This command must be used in a server channel.",
            flags: MessageFlags.Ephemeral,
          },
        });
        return;
      }
      const key = generateApiKey();
      await upsertApiKey(
        interaction.member!.user.id,
        interaction.guild_id,
        channelId,
        key,
      );
      res.send({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content:
            `Your API key for this channel:\n\`\`\`\n${key}\n\`\`\`\n` +
            `Store it securely — it won't be shown again. Re-run \`/quests api-key\` to rotate it (this invalidates the old key).`,
          flags: MessageFlags.Ephemeral,
        },
      });
      return;
    }
    default:
      res.send({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: getQuestsSubcommandHelpText(),
        },
      });
  }
}
