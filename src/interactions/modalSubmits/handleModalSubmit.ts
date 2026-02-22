import type { Request, Response } from "express";
import {
  QUEST_ADD_MODAL_ID,
  QUEST_ADVANCE_MODAL_ID,
  QUEST_COMPLETE_MODAL_ID,
  QUEST_SUBQUEST_MODAL_ID,
  QUEST_CLEAR_MODAL_ID,
  QUEST_DELETE_MODAL_ID,
} from "../questModalIds";
import { handleQuestAdvanceModalSubmit } from "./questAdvanceModalSubmit";
import { handleQuestAddModalSubmit } from "./questAddModalSubmit";
import { handleQuestCompleteModalSubmit } from "./questCompleteModalSubmit";
import { handleQuestSubquestModalSubmit } from "./questSubquestModalSubmit";
import { handleQuestClearModalSubmit } from "./questClearModalSubmit";
import { handleQuestDeleteModalSubmit } from "./questDeleteModalSubmit";

function getModalBaseId(customId: string): string {
  const colonIndex = customId.indexOf(":");
  return colonIndex === -1 ? customId : customId.slice(0, colonIndex);
}

/**
 * Routes modal submit interactions to the appropriate handler based on custom_id.
 * Handles quest add, advance, complete, delete, clear, and subquest modals.
 *
 * @param req - Express request containing the modal submission data
 * @param res - Express response for sending the interaction response
 */
export async function handleModalSubmit(
  req: Request,
  res: Response
): Promise<void> {
  const { data, channel_id } = req.body;
  const channelId = channel_id as string;
  const modalBaseId = getModalBaseId(data.custom_id);
  switch (modalBaseId) {
    case QUEST_ADVANCE_MODAL_ID:
      await handleQuestAdvanceModalSubmit(channelId, data, res);
      return;
    case QUEST_ADD_MODAL_ID:
      await handleQuestAddModalSubmit(channelId, data, res);
      return;
    case QUEST_SUBQUEST_MODAL_ID:
      await handleQuestSubquestModalSubmit(channelId, data, res);
      return;
    case QUEST_COMPLETE_MODAL_ID:
      await handleQuestCompleteModalSubmit(channelId, data, res);
      return;
    case QUEST_CLEAR_MODAL_ID:
      await handleQuestClearModalSubmit(req.body, res);
      return;
    case QUEST_DELETE_MODAL_ID:
      await handleQuestDeleteModalSubmit(req.body, res);
      return;
    default:
      res.status(400).send({ error: "Unknown modal" });
      return;
  }
}
