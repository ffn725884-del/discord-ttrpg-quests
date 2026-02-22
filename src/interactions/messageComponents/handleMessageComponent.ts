import type { Request, Response } from "express";
import { GM_ASSIGN_USER_SELECT_CUSTOM_ID } from "../gmComponentIds";
import { handleGmAssignUserSelect } from "./gmUserSelectHandler";

function getComponentBaseId(customId: string): string {
  const colonIndex = customId.indexOf(":");
  return colonIndex === -1 ? customId : customId.slice(0, colonIndex);
}

/**
 * Routes message component interactions to the appropriate handler based on custom_id.
 */
export async function handleMessageComponent(
  req: Request,
  res: Response,
): Promise<void> {
  const { data } = req.body;
  const customId = data?.custom_id;
  if (!customId) {
    res.status(400).send({ error: "Missing component custom_id" });
    return;
  }

  const baseId = getComponentBaseId(customId);
  switch (baseId) {
    case GM_ASSIGN_USER_SELECT_CUSTOM_ID:
      await handleGmAssignUserSelect(req.body, res);
      return;
    default:
      res.status(400).send({ error: "Unknown message component" });
      return;
  }
}
