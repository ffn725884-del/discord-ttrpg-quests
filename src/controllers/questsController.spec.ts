import {
  getQuestsForShow,
  getQuestsForShowCompleted,
  getAdvanceModal,
  getCompleteModal,
  getSubquestModal,
  getPrepareModal,
  getRevealModal,
  getDiscardModal,
  createQuest,
  createPreparedQuest,
  revealPreparedQuest,
  discardPreparedQuest,
  recordQuestProgress,
  completeQuest,
  type QuestAdvanceModalConfig,
  type QuestCompleteModalConfig,
  type QuestSubquestModalConfig,
  type QuestPrepareModalConfig,
  type QuestRevealModalConfig,
  type QuestDiscardModalConfig,
} from "./questsController";
import {
  ComponentType,
  InteractionResponseType,
  MessageFlags,
} from "discord-api-types/v10";
import * as questsDAL from "../dal/questsDAL";

jest.mock("../dal/questsDAL");

const mockGetActiveQuests = questsDAL.getActiveQuests as jest.MockedFunction<
  typeof questsDAL.getActiveQuests
>;
const mockGetCompletedQuests =
  questsDAL.getCompletedQuests as jest.MockedFunction<
    typeof questsDAL.getCompletedQuests
  >;
const mockGetTopLevelActiveQuests =
  questsDAL.getTopLevelActiveQuests as jest.MockedFunction<
    typeof questsDAL.getTopLevelActiveQuests
  >;
const mockAddQuestProgress = questsDAL.addQuestProgress as jest.MockedFunction<
  typeof questsDAL.addQuestProgress
>;
const mockAddQuest = questsDAL.addQuest as jest.MockedFunction<
  typeof questsDAL.addQuest
>;
mockAddQuest.mockResolvedValue(undefined);
const mockCompleteQuest = questsDAL.completeQuest as jest.MockedFunction<
  typeof questsDAL.completeQuest
>;
const mockGetTopLevelQuestsForParentSelect =
  questsDAL.getTopLevelQuestsForParentSelect as jest.MockedFunction<
    typeof questsDAL.getTopLevelQuestsForParentSelect
  >;
const mockGetPreparedQuests = questsDAL.getPreparedQuests as jest.MockedFunction<
  typeof questsDAL.getPreparedQuests
>;
const mockRevealPreparedQuest =
  questsDAL.revealPreparedQuest as jest.MockedFunction<
    typeof questsDAL.revealPreparedQuest
  >;
const mockDeleteQuest = questsDAL.deleteQuest as jest.MockedFunction<
  typeof questsDAL.deleteQuest
>;

const TEST_CHANNEL_ID = "channel-123";

describe("questsController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getQuestsForShow", () => {
    it("returns formatted response with no quests when DAL returns empty", async () => {
      mockGetActiveQuests.mockResolvedValue([]);
      mockGetCompletedQuests.mockResolvedValue([]);

      const result = (await getQuestsForShow(TEST_CHANNEL_ID)) as {
        type: number;
        data: { content: string };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toBe("No active quests in your journal.");
      expect(mockGetActiveQuests).toHaveBeenCalledWith(TEST_CHANNEL_ID);
      expect(mockGetCompletedQuests).toHaveBeenCalledWith(TEST_CHANNEL_ID);
    });

    it("returns formatted response with quest list when DAL returns quests", async () => {
      mockGetActiveQuests.mockResolvedValue([
        {
          id: "q1",
          channelId: TEST_CHANNEL_ID,
          name: "Slay the Dragon",
          progress: ["Found the cave", "Entered the lair"],
        },
      ]);
      mockGetCompletedQuests.mockResolvedValue([]);

      const result = (await getQuestsForShow(TEST_CHANNEL_ID)) as {
        type: number;
        data: { content: string };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toContain("Slay the Dragon");
      expect(result.data.content).toContain("Found the cave");
      expect(result.data.content).toContain("Entered the lair");
    });
  });

  describe("getQuestsForShowCompleted", () => {
    it("returns formatted response with no quests when DAL returns empty", async () => {
      mockGetCompletedQuests.mockResolvedValue([]);

      const result = (await getQuestsForShowCompleted(TEST_CHANNEL_ID)) as {
        type: number;
        data: { content: string };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toBe("No completed quests.");
      expect(mockGetCompletedQuests).toHaveBeenCalledWith(TEST_CHANNEL_ID);
    });

    it("returns formatted response with quest list, resolution only, and checkmark", async () => {
      mockGetCompletedQuests.mockResolvedValue([
        {
          id: "q1",
          channelId: TEST_CHANNEL_ID,
          name: "Slain Dragon",
          progress: [
            "Found the cave",
            "Entered the lair",
            "Defeated the beast",
          ],
          completed: true,
        },
      ]);

      const result = (await getQuestsForShowCompleted(TEST_CHANNEL_ID)) as {
        type: number;
        data: { content: string };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toContain("Slain Dragon");
      expect(result.data.content).toContain("Defeated the beast");
      expect(result.data.content).toContain("✅");
      expect(result.data.content).not.toContain("Found the cave");
      expect(result.data.content).not.toContain("Entered the lair");
    });
  });

  describe("getAdvanceModal", () => {
    const modalConfig: QuestAdvanceModalConfig = {
      modalId: "advance-modal-1",
      questSelectId: "quest-select",
      progressInputId: "progress-input",
    };

    it("returns text message when no quests available", async () => {
      mockGetActiveQuests.mockResolvedValue([]);

      const result = (await getAdvanceModal(TEST_CHANNEL_ID, modalConfig)) as {
        type: number;
        data: { content: string };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toBe(
        "No quests available. Create a quest first.",
      );
    });

    it("returns modal with quest select and progress input when quests exist", async () => {
      mockGetActiveQuests.mockResolvedValue([
        {
          id: "q1",
          channelId: TEST_CHANNEL_ID,
          name: "Quest One",
          progress: [],
        },
      ]);

      const result = (await getAdvanceModal(TEST_CHANNEL_ID, modalConfig)) as {
        type: number;
        data: { custom_id: string; components: unknown[] };
      };

      expect(result.type).toBe(InteractionResponseType.Modal);
      expect(result.data.custom_id).toBe("advance-modal-1");
      expect(result.data.components).toHaveLength(2);
      expect(result.data.components[0]).toMatchObject({
        type: ComponentType.Label,
        label: "Quest",
        component: {
          type: ComponentType.StringSelect,
          custom_id: "quest-select",
          options: [{ label: "Quest One", value: "q1" }],
        },
      });
      expect(mockGetActiveQuests).toHaveBeenCalledWith(TEST_CHANNEL_ID);
    });
  });

  describe("getCompleteModal", () => {
    const modalConfig: QuestCompleteModalConfig = {
      modalId: "complete-modal-1",
      questSelectId: "quest-select",
      resolutionInputId: "resolution-input",
    };

    it("returns text message when no quests available", async () => {
      mockGetActiveQuests.mockResolvedValue([]);

      const result = (await getCompleteModal(TEST_CHANNEL_ID, modalConfig)) as {
        type: number;
        data: { content: string };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toBe("No quests available to complete.");
    });

    it("returns modal with quest select and resolution input when quests exist", async () => {
      mockGetActiveQuests.mockResolvedValue([
        {
          id: "q1",
          channelId: TEST_CHANNEL_ID,
          name: "Quest One",
          progress: [],
        },
      ]);

      const result = (await getCompleteModal(TEST_CHANNEL_ID, modalConfig)) as {
        type: number;
        data: { custom_id: string; components: unknown[] };
      };

      expect(result.type).toBe(InteractionResponseType.Modal);
      expect(result.data.custom_id).toBe("complete-modal-1");
      expect(result.data.components).toHaveLength(3);
      expect(result.data.components[0]).toMatchObject({
        type: ComponentType.Label,
        label: "Quest",
        component: {
          type: ComponentType.StringSelect,
          custom_id: "quest-select",
        },
      });
      expect(result.data.components[2]).toMatchObject({
        type: ComponentType.TextDisplay,
        content:
          "Note: Completing a main quest will auto-complete all its subquests.",
      });
    });
  });

  describe("getSubquestModal", () => {
    const modalConfig: QuestSubquestModalConfig = {
      modalId: "subquest-modal-1",
      parentQuestSelectId: "parent-select",
      nameInputId: "name-input",
      progressInputId: "progress-input",
    };

    it("returns text message when no top-level quests available", async () => {
      mockGetTopLevelActiveQuests.mockResolvedValue([]);

      const result = (await getSubquestModal(TEST_CHANNEL_ID, modalConfig)) as {
        type: number;
        data: { content: string };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toBe(
        "No top-level quests available. Create a quest first.",
      );
    });

    it("returns modal with parent select and inputs when quests exist", async () => {
      mockGetTopLevelActiveQuests.mockResolvedValue([
        {
          id: "q1",
          channelId: TEST_CHANNEL_ID,
          name: "Quest One",
          progress: [],
        },
      ]);

      const result = (await getSubquestModal(TEST_CHANNEL_ID, modalConfig)) as {
        type: number;
        data: { custom_id: string; components: unknown[] };
      };

      expect(result.type).toBe(InteractionResponseType.Modal);
      expect(result.data.custom_id).toBe("subquest-modal-1");
      expect(result.data.components).toHaveLength(3);
      expect(result.data.components[0]).toMatchObject({
        type: ComponentType.Label,
        label: "Parent Quest",
        component: {
          type: ComponentType.StringSelect,
          custom_id: "parent-select",
        },
      });
      expect(mockGetTopLevelActiveQuests).toHaveBeenCalledWith(TEST_CHANNEL_ID);
    });
  });

  describe("getPrepareModal", () => {
    const modalConfig: QuestPrepareModalConfig = {
      modalId: "prepare-modal-1",
      parentQuestSelectId: "parent-select",
      nameInputId: "name-input",
      progressInputId: "progress-input",
    };

    it("returns modal with no-parent option when no top-level quests", async () => {
      mockGetTopLevelQuestsForParentSelect.mockResolvedValue([]);

      const result = (await getPrepareModal(TEST_CHANNEL_ID, modalConfig)) as {
        type: number;
        data: { custom_id: string; components: unknown[] };
      };

      expect(result.type).toBe(InteractionResponseType.Modal);
      expect(result.data.custom_id).toBe("prepare-modal-1");
      expect(result.data.components).toHaveLength(3);
      expect(mockGetTopLevelQuestsForParentSelect).toHaveBeenCalledWith(
        TEST_CHANNEL_ID,
      );
    });

    it("returns modal with parent options when quests exist", async () => {
      mockGetTopLevelQuestsForParentSelect.mockResolvedValue([
        {
          id: "q1",
          channelId: TEST_CHANNEL_ID,
          name: "Main Quest",
          progress: [],
        },
      ]);

      const result = (await getPrepareModal(TEST_CHANNEL_ID, modalConfig)) as {
        type: number;
        data: { custom_id: string; components: unknown[] };
      };

      expect(result.type).toBe(InteractionResponseType.Modal);
      expect(result.data.components[0]).toMatchObject({
        type: ComponentType.Label,
        label: "Parent Quest",
        component: {
          type: ComponentType.StringSelect,
          custom_id: "parent-select",
        },
      });
    });
  });

  describe("getRevealModal", () => {
    const modalConfig: QuestRevealModalConfig = {
      modalId: "reveal-modal-1",
      questSelectId: "quest-select",
    };

    it("returns text message when no prepared quests", async () => {
      mockGetPreparedQuests.mockResolvedValue([]);

      const result = (await getRevealModal(TEST_CHANNEL_ID, modalConfig)) as {
        type: number;
        data: { content: string };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toBe("No prepared quests to reveal.");
    });

    it("returns modal when prepared quests exist", async () => {
      mockGetPreparedQuests.mockResolvedValue([
        {
          id: "q1",
          channelId: TEST_CHANNEL_ID,
          name: "Secret Quest",
          progress: [],
        },
      ]);

      const result = (await getRevealModal(TEST_CHANNEL_ID, modalConfig)) as {
        type: number;
        data: { custom_id: string };
      };

      expect(result.type).toBe(InteractionResponseType.Modal);
      expect(result.data.custom_id).toBe("reveal-modal-1");
    });
  });

  describe("getDiscardModal", () => {
    const modalConfig: QuestDiscardModalConfig = {
      modalId: "discard-modal-1",
      questSelectId: "quest-select",
    };

    it("returns text message when no prepared quests", async () => {
      mockGetPreparedQuests.mockResolvedValue([]);

      const result = (await getDiscardModal(TEST_CHANNEL_ID, modalConfig)) as {
        type: number;
        data: { content: string };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toBe("No prepared quests to discard.");
    });

    it("returns modal when prepared quests exist", async () => {
      mockGetPreparedQuests.mockResolvedValue([
        {
          id: "q1",
          channelId: TEST_CHANNEL_ID,
          name: "Secret Quest",
          progress: [],
        },
      ]);

      const result = (await getDiscardModal(TEST_CHANNEL_ID, modalConfig)) as {
        type: number;
        data: { custom_id: string };
      };

      expect(result.type).toBe(InteractionResponseType.Modal);
      expect(result.data.custom_id).toBe("discard-modal-1");
    });
  });

  describe("createPreparedQuest", () => {
    it("calls addQuest with prepared true and returns ephemeral success", async () => {
      const result = (await createPreparedQuest(
        TEST_CHANNEL_ID,
        "Secret Quest",
        "Initial details",
      )) as {
        type: number;
        data: { content: string; flags: number };
      };

      expect(mockAddQuest).toHaveBeenCalledWith(TEST_CHANNEL_ID, {
        name: "Secret Quest",
        progress: ["Initial details"],
        prepared: true,
      });
      expect(result.data.content).toContain("Secret Quest");
      expect(result.data.content).toContain("reveal");
      expect(result.data.flags).toBe(MessageFlags.Ephemeral)
    });

    it("creates subquest when parentQuestId provided", async () => {
      await createPreparedQuest(
        TEST_CHANNEL_ID,
        "Secret Subquest",
        "",
        "parent-1",
      );

      expect(mockAddQuest).toHaveBeenCalledWith(TEST_CHANNEL_ID, {
        name: "Secret Subquest",
        progress: [],
        parentQuestId: "parent-1",
        prepared: true,
      });
    });
  });

  describe("revealPreparedQuest", () => {
    it("returns quest added message when reveal succeeds", async () => {
      mockRevealPreparedQuest.mockResolvedValue({
        id: "q1",
        channelId: TEST_CHANNEL_ID,
        name: "Revealed Quest",
        progress: [],
        parentQuestId: undefined,
      });

      const result = (await revealPreparedQuest(
        TEST_CHANNEL_ID,
        "q1",
      )) as {
        data: { content: string };
      };

      expect(mockRevealPreparedQuest).toHaveBeenCalledWith(
        TEST_CHANNEL_ID,
        "q1",
      );
      expect(result.data.content).toBe(
        'Quest "Revealed Quest" added to your journal!',
      );
    });

    it("returns subquest added message when revealing subquest", async () => {
      mockRevealPreparedQuest.mockResolvedValue({
        id: "q2",
        channelId: TEST_CHANNEL_ID,
        name: "Revealed Subquest",
        progress: [],
        parentQuestId: "q1",
      });

      const result = (await revealPreparedQuest(
        TEST_CHANNEL_ID,
        "q2",
      )) as {
        data: { content: string };
      };

      expect(result.data.content).toBe(
        'Subquest "Revealed Subquest" added to your journal!',
      );
    });

    it("returns not found when reveal returns null", async () => {
      mockRevealPreparedQuest.mockResolvedValue(null);

      const result = (await revealPreparedQuest(
        TEST_CHANNEL_ID,
        "invalid",
      )) as {
        data: { content: string };
      };

      expect(result.data.content).toBe("Quest not found. Please try again.");
    });
  });

  describe("discardPreparedQuest", () => {
    it("returns ephemeral success when discard succeeds", async () => {
      mockGetPreparedQuests.mockResolvedValue([
        {
          id: "q1",
          channelId: TEST_CHANNEL_ID,
          name: "To Discard",
          progress: [],
        },
      ]);
      mockDeleteQuest.mockResolvedValue(true);

      const result = (await discardPreparedQuest(
        TEST_CHANNEL_ID,
        "q1",
      )) as {
        data: { content: string; flags: number };
      };

      expect(mockDeleteQuest).toHaveBeenCalledWith(TEST_CHANNEL_ID, "q1");
      expect(result.data.content).toContain("To Discard");
      expect(result.data.content).toContain("discarded");
      expect(result.data.flags).toBe(MessageFlags.Ephemeral)
    });

    it("returns not found when delete returns false", async () => {
      mockGetPreparedQuests.mockResolvedValue([]);
      mockDeleteQuest.mockResolvedValue(false);

      const result = (await discardPreparedQuest(
        TEST_CHANNEL_ID,
        "q1",
      )) as {
        data: { content: string };
      };

      expect(result.data.content).toBe("Quest not found. Please try again.");
    });
  });

  describe("createQuest", () => {
    it("calls addQuest and returns success message", async () => {
      const result = (await createQuest(
        TEST_CHANNEL_ID,
        "New Quest",
        "Initial progress",
      )) as {
        type: number;
        data: { content: string };
      };

      expect(mockAddQuest).toHaveBeenCalledWith(TEST_CHANNEL_ID, {
        name: "New Quest",
        progress: ["Initial progress"],
      });
      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toBe(
        'Quest "New Quest" added to your journal!',
      );
    });

    it("creates quest with empty progress when progress is empty string", async () => {
      await createQuest(TEST_CHANNEL_ID, "Solo Quest", "");

      expect(mockAddQuest).toHaveBeenCalledWith(TEST_CHANNEL_ID, {
        name: "Solo Quest",
        progress: [],
      });
    });

    it("trims progress text", async () => {
      await createQuest(TEST_CHANNEL_ID, "Quest", "  spaced progress  ");

      expect(mockAddQuest).toHaveBeenCalledWith(TEST_CHANNEL_ID, {
        name: "Quest",
        progress: ["spaced progress"],
      });
    });
  });

  describe("recordQuestProgress", () => {
    it("returns success message when addQuestProgress returns true", async () => {
      mockAddQuestProgress.mockResolvedValue(true);

      const result = (await recordQuestProgress(
        TEST_CHANNEL_ID,
        "q1",
        "Made progress",
      )) as {
        data: { content: string };
      };

      expect(mockAddQuestProgress).toHaveBeenCalledWith(
        TEST_CHANNEL_ID,
        "q1",
        "Made progress",
      );
      expect(result.data.content).toBe("Adventure progress logged!");
    });

    it("returns not found message when addQuestProgress returns false", async () => {
      mockAddQuestProgress.mockResolvedValue(false);

      const result = (await recordQuestProgress(
        TEST_CHANNEL_ID,
        "invalid-id",
        "Progress",
      )) as {
        data: { content: string };
      };

      expect(result.data.content).toBe("Quest not found. Please try again.");
    });
  });

  describe("completeQuest", () => {
    it("returns success message when completeQuestInDAL returns true", async () => {
      mockCompleteQuest.mockResolvedValue(true);

      const result = (await completeQuest(
        TEST_CHANNEL_ID,
        "q1",
        "Victory!",
      )) as {
        data: { content: string };
      };

      expect(mockCompleteQuest).toHaveBeenCalledWith(
        TEST_CHANNEL_ID,
        "q1",
        "Victory!",
      );
      expect(result.data.content).toBe("Quest completed successfully!");
    });

    it("returns not found message when completeQuestInDAL returns false", async () => {
      mockCompleteQuest.mockResolvedValue(false);

      const result = (await completeQuest(
        TEST_CHANNEL_ID,
        "invalid-id",
        "Resolution",
      )) as {
        data: { content: string };
      };

      expect(result.data.content).toBe("Quest not found. Please try again.");
    });
  });
});
