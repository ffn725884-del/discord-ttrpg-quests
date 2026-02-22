import type { APIChatInputApplicationCommandInteraction } from "discord-api-types/v10";
import type { Response } from "express";
import { InteractionResponseType } from "discord-api-types/v10";
import { QUESTS_COMMAND, QUEST_SUBCOMMANDS } from "../../commandDefinitions";
import { hasAdminPermission } from "../../utils/permissions";
import { buildPermissionDeniedResponse } from "../../presentation/permissionResponseBuilder";
import {
  getQuestsForShow,
  getQuestsForShowAll,
  getQuestsForShowCompleted,
  getAdvanceModal,
  getSubquestModal,
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
  const subcommand = interaction.data.options?.[0]?.name;
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
    default:
      res.send({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: getQuestsSubcommandHelpText(),
        },
      });
  }
}
