import type {
  APIInteractionResponse,
  APIMessageComponentEmoji,
  APISelectMenuOption,
} from "discord-api-types/v10";
import {
  ComponentType,
  InteractionResponseType,
  MessageFlags,
  TextInputStyle,
} from "discord-api-types/v10";
import { MAIN_QUEST_EMOJI, STRINGS } from "./questsStrings";

export interface QuestAdvanceModalConfig {
  modalId: string;
  questSelectId: string;
  progressInputId: string;
}

export interface QuestAddModalConfig {
  modalId: string;
  nameInputId: string;
  progressInputId: string;
}

export interface QuestCompleteModalConfig {
  modalId: string;
  questSelectId: string;
  resolutionInputId: string;
}

export interface QuestSubquestModalConfig {
  modalId: string;
  parentQuestSelectId: string;
  nameInputId: string;
  progressInputId: string;
}

export interface QuestClearModalConfig {
  modalId: string;
  confirmInputId: string;
}

export interface QuestDeleteModalConfig {
  modalId: string;
  questSelectId: string;
}

export interface QuestPrepareModalConfig {
  modalId: string;
  parentQuestSelectId: string;
  nameInputId: string;
  progressInputId: string;
}

export interface QuestRevealModalConfig {
  modalId: string;
  questSelectId: string;
}

export interface QuestDiscardModalConfig {
  modalId: string;
  questSelectId: string;
}

interface QuestOption {
  id: string;
  name: string;
  parentQuestId?: string;
}

function addEmojiToQuestOptions<T extends QuestOption>(
  quests: T[],
  emoji?: APIMessageComponentEmoji,
): APISelectMenuOption[] {
  return quests.map((q) => {
    const option: APISelectMenuOption = {
      label: q.name,
      value: q.id,
    };
    if (emoji) option.emoji = emoji;
    return option;
  });
}

function buildQuestSelectOptions(quests: QuestOption[]): APISelectMenuOption[] {
  return quests.flatMap((q) =>
    q.parentQuestId
      ? addEmojiToQuestOptions([q])
      : addEmojiToQuestOptions([q], MAIN_QUEST_EMOJI),
  );
}

/**
 * Builds a Discord interaction response that sends a plain text message.
 *
 * @param content - The message content to display
 * @param ephemeral - If true, message is only visible to the invoker
 * @returns Discord API interaction response
 */
export function buildMessageResponse(
  content: string,
  ephemeral?: boolean,
): APIInteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content,
      ...(ephemeral && { flags: MessageFlags.Ephemeral }),
    },
  };
}

/**
 * Builds a Discord modal for selecting a quest and entering progress text.
 *
 * @param quests - List of quests to populate the select dropdown
 * @param config - Modal configuration (IDs for modal, quest select, progress input)
 * @returns Discord API interaction response (modal)
 */
export function buildAdvanceModalResponse(
  quests: QuestOption[],
  config: QuestAdvanceModalConfig,
): APIInteractionResponse {
  const options = buildQuestSelectOptions(quests);
  return {
    type: InteractionResponseType.Modal,
    data: {
      custom_id: config.modalId,
      title: STRINGS.advanceModalTitle,
      components: [
        {
          type: ComponentType.Label,
          label: STRINGS.advanceModalQuestLabel,
          description: STRINGS.advanceModalQuestDescription,
          component: {
            type: ComponentType.StringSelect,
            custom_id: config.questSelectId,
            placeholder: STRINGS.questSelectPlaceholder,
            options,
            required: true,
          },
        },
        {
          type: ComponentType.Label,
          label: STRINGS.advanceModalProgressLabel,
          description: STRINGS.advanceModalProgressDescription,
          component: {
            type: ComponentType.TextInput,
            custom_id: config.progressInputId,
            style: TextInputStyle.Paragraph,
            placeholder: STRINGS.advanceModalProgressPlaceholder,
            required: true,
          },
        },
      ],
    },
  };
}

/**
 * Builds a Discord modal for selecting a quest and entering resolution text.
 *
 * @param quests - List of quests to populate the select dropdown
 * @param config - Modal configuration (IDs for modal, quest select, resolution input)
 * @returns Discord API interaction response (modal)
 */
export function buildCompleteModalResponse(
  quests: QuestOption[],
  config: QuestCompleteModalConfig,
): APIInteractionResponse {
  const options = buildQuestSelectOptions(quests);
  return {
    type: InteractionResponseType.Modal,
    data: {
      custom_id: config.modalId,
      title: STRINGS.completeModalTitle,
      components: [
        {
          type: ComponentType.Label,
          label: STRINGS.completeModalQuestLabel,
          description: STRINGS.completeModalQuestDescription,
          component: {
            type: ComponentType.StringSelect,
            custom_id: config.questSelectId,
            placeholder: STRINGS.questSelectPlaceholder,
            options,
            required: true,
          },
        },
        {
          type: ComponentType.Label,
          label: STRINGS.completeModalResolutionLabel,
          description: STRINGS.completeModalResolutionDescription,
          component: {
            type: ComponentType.TextInput,
            custom_id: config.resolutionInputId,
            style: TextInputStyle.Paragraph,
            placeholder: STRINGS.completeModalResolutionPlaceholder,
            required: true,
          },
        },
        {
          type: ComponentType.TextDisplay,
          content: STRINGS.completeModalNote,
        },
      ],
    },
  };
}

/**
 * Builds a Discord modal for adding a new quest (name and optional details).
 *
 * @param config - Modal configuration (IDs for modal, name input, progress input)
 * @returns Discord API interaction response (modal)
 */
export function buildAddModalResponse(
  config: QuestAddModalConfig,
): APIInteractionResponse {
  return {
    type: InteractionResponseType.Modal,
    data: {
      custom_id: config.modalId,
      title: STRINGS.addModalTitle,
      components: [
        {
          type: ComponentType.Label,
          label: STRINGS.addModalNameLabel,
          component: {
            type: ComponentType.TextInput,
            custom_id: config.nameInputId,
            style: TextInputStyle.Short,
            placeholder: STRINGS.addModalNamePlaceholder,
            required: true,
          },
        },
        {
          type: ComponentType.Label,
          label: STRINGS.addModalDetailsLabel,
          description: STRINGS.addModalDetailsDescription,
          component: {
            type: ComponentType.TextInput,
            custom_id: config.progressInputId,
            style: TextInputStyle.Paragraph,
            placeholder: STRINGS.addModalDetailsPlaceholder,
            required: false,
          },
        },
      ],
    },
  };
}

/**
 * Builds a Discord modal for selecting a quest to delete.
 *
 * @param quests - List of quests to populate the select dropdown
 * @param config - Modal configuration (IDs for modal, quest select)
 * @returns Discord API interaction response (modal)
 */
export function buildDeleteModalResponse(
  quests: QuestOption[],
  config: QuestDeleteModalConfig,
): APIInteractionResponse {
  const options = buildQuestSelectOptions(quests);
  return {
    type: InteractionResponseType.Modal,
    data: {
      custom_id: config.modalId,
      title: STRINGS.deleteModalTitle,
      components: [
        {
          type: ComponentType.Label,
          label: STRINGS.deleteModalQuestLabel,
          description: STRINGS.deleteModalQuestDescription,
          component: {
            type: ComponentType.StringSelect,
            custom_id: config.questSelectId,
            placeholder: STRINGS.questSelectPlaceholder,
            options,
            required: true,
          },
        },
      ],
    },
  };
}

/**
 * Builds a Discord modal for confirming clearing all quests (with quest count).
 *
 * @param count - Number of quests that will be cleared
 * @param config - Modal configuration (IDs for modal, confirmation input)
 * @returns Discord API interaction response (modal)
 */
export function buildClearModalResponse(
  count: number,
  config: QuestClearModalConfig,
): APIInteractionResponse {
  return {
    type: InteractionResponseType.Modal,
    data: {
      custom_id: config.modalId,
      title: STRINGS.clearModalTitle,
      components: [
        {
          type: ComponentType.Label,
          label: STRINGS.clearModalLabel,
          description: STRINGS.clearModalDescription(count),
          component: {
            type: ComponentType.TextInput,
            custom_id: config.confirmInputId,
            style: TextInputStyle.Short,
            placeholder: STRINGS.clearModalPlaceholder,
            required: true,
          },
        },
      ],
    },
  };
}

/**
 * Builds a Discord modal for preparing a quest (optional parent, name, details).
 *
 * @param topLevelQuests - List of top-level quests for optional parent dropdown
 * @param config - Modal configuration (IDs for modal, parent select, name, progress inputs)
 * @returns Discord API interaction response (modal)
 */
export function buildPrepareModalResponse(
  topLevelQuests: QuestOption[],
  config: QuestPrepareModalConfig,
): APIInteractionResponse {
  const noParentOption: APISelectMenuOption = {
    label: STRINGS.prepareNoParentOption,
    value: "",
  };
  const parentOptions = topLevelQuests.length
    ? [noParentOption, ...addEmojiToQuestOptions(topLevelQuests, MAIN_QUEST_EMOJI)]
    : [noParentOption];

  return {
    type: InteractionResponseType.Modal,
    data: {
      custom_id: config.modalId,
      title: STRINGS.prepareModalTitle,
      components: [
        {
          type: ComponentType.Label,
          label: STRINGS.prepareModalParentLabel,
          description: STRINGS.prepareModalParentDescription,
          component: {
            type: ComponentType.StringSelect,
            custom_id: config.parentQuestSelectId,
            placeholder: STRINGS.parentQuestPlaceholder,
            options: parentOptions,
            required: true,
          },
        },
        {
          type: ComponentType.Label,
          label: STRINGS.prepareModalNameLabel,
          component: {
            type: ComponentType.TextInput,
            custom_id: config.nameInputId,
            style: TextInputStyle.Short,
            placeholder: STRINGS.prepareModalNamePlaceholder,
            required: true,
          },
        },
        {
          type: ComponentType.Label,
          label: STRINGS.prepareModalDetailsLabel,
          description: STRINGS.prepareModalDetailsDescription,
          component: {
            type: ComponentType.TextInput,
            custom_id: config.progressInputId,
            style: TextInputStyle.Paragraph,
            placeholder: STRINGS.prepareModalDetailsPlaceholder,
            required: false,
          },
        },
      ],
    },
  };
}

/**
 * Builds a Discord modal for revealing a prepared quest.
 *
 * @param quests - List of prepared quests to populate the select dropdown
 * @param config - Modal configuration (IDs for modal, quest select)
 * @returns Discord API interaction response (modal)
 */
export function buildRevealModalResponse(
  quests: QuestOption[],
  config: QuestRevealModalConfig,
): APIInteractionResponse {
  const options = buildQuestSelectOptions(quests);
  return {
    type: InteractionResponseType.Modal,
    data: {
      custom_id: config.modalId,
      title: STRINGS.revealModalTitle,
      components: [
        {
          type: ComponentType.Label,
          label: STRINGS.revealModalQuestLabel,
          description: STRINGS.revealModalQuestDescription,
          component: {
            type: ComponentType.StringSelect,
            custom_id: config.questSelectId,
            placeholder: STRINGS.questSelectPlaceholder,
            options,
            required: true,
          },
        },
      ],
    },
  };
}

/**
 * Builds a Discord modal for discarding a prepared quest.
 *
 * @param quests - List of prepared quests to populate the select dropdown
 * @param config - Modal configuration (IDs for modal, quest select)
 * @returns Discord API interaction response (modal)
 */
export function buildDiscardModalResponse(
  quests: QuestOption[],
  config: QuestDiscardModalConfig,
): APIInteractionResponse {
  const options = buildQuestSelectOptions(quests);
  return {
    type: InteractionResponseType.Modal,
    data: {
      custom_id: config.modalId,
      title: STRINGS.discardModalTitle,
      components: [
        {
          type: ComponentType.Label,
          label: STRINGS.discardModalQuestLabel,
          description: STRINGS.discardModalQuestDescription,
          component: {
            type: ComponentType.StringSelect,
            custom_id: config.questSelectId,
            placeholder: STRINGS.questSelectPlaceholder,
            options,
            required: true,
          },
        },
      ],
    },
  };
}

/**
 * Builds a Discord modal for adding a subquest (parent select, name, details).
 *
 * @param quests - List of top-level quests to populate the parent select dropdown
 * @param config - Modal configuration (IDs for modal, parent select, name, progress inputs)
 * @returns Discord API interaction response (modal)
 */
export function buildSubquestModalResponse(
  quests: QuestOption[],
  config: QuestSubquestModalConfig,
): APIInteractionResponse {
  const options = addEmojiToQuestOptions(quests, MAIN_QUEST_EMOJI);
  return {
    type: InteractionResponseType.Modal,
    data: {
      custom_id: config.modalId,
      title: STRINGS.subquestModalTitle,
      components: [
        {
          type: ComponentType.Label,
          label: STRINGS.subquestModalParentLabel,
          description: STRINGS.subquestModalParentDescription,
          component: {
            type: ComponentType.StringSelect,
            custom_id: config.parentQuestSelectId,
            placeholder: STRINGS.parentQuestPlaceholder,
            options,
            required: true,
          },
        },
        {
          type: ComponentType.Label,
          label: STRINGS.subquestModalNameLabel,
          component: {
            type: ComponentType.TextInput,
            custom_id: config.nameInputId,
            style: TextInputStyle.Short,
            placeholder: STRINGS.subquestModalNamePlaceholder,
            required: true,
          },
        },
        {
          type: ComponentType.Label,
          label: STRINGS.subquestModalDetailsLabel,
          description: STRINGS.subquestModalDetailsDescription,
          component: {
            type: ComponentType.TextInput,
            custom_id: config.progressInputId,
            style: TextInputStyle.Paragraph,
            placeholder: STRINGS.subquestModalDetailsPlaceholder,
            required: false,
          },
        },
      ],
    },
  };
}
