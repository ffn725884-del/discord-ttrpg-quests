import {
  buildMessageResponse,
  buildAdvanceModalResponse,
  buildCompleteModalResponse,
  buildAddModalResponse,
  buildDeleteModalResponse,
  buildClearModalResponse,
  buildSubquestModalResponse,
  type QuestAdvanceModalConfig,
  type QuestAddModalConfig,
  type QuestCompleteModalConfig,
  type QuestSubquestModalConfig,
  type QuestClearModalConfig,
  type QuestDeleteModalConfig,
} from "./questsResponseBuilders";
import {
  ComponentType,
  InteractionResponseType,
  MessageFlags,
} from "discord-api-types/v10";

const SAMPLE_QUESTS = [
  { id: "q1", name: "Main Quest", parentQuestId: undefined },
  { id: "q2", name: "Subquest", parentQuestId: "q1" },
];

describe("questsResponseBuilders", () => {
  describe("buildMessageResponse", () => {
    it("returns channel message with given content", () => {
      const result = buildMessageResponse("Hello, world!") as {
        type: number;
        data: { content: string };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toBe("Hello, world!");
    });

    it("returns ephemeral message when ephemeral is true", () => {
      const result = buildMessageResponse("Private!", true) as {
        type: number;
        data: { content: string; flags: number };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toBe("Private!");
      expect(result.data.flags).toBe(MessageFlags.Ephemeral);
    });
  });

  describe("buildAdvanceModalResponse", () => {
    const config: QuestAdvanceModalConfig = {
      modalId: "advance-modal",
      questSelectId: "quest-select",
      progressInputId: "progress-input",
    };

    it("returns modal with quest select and progress input", () => {
      const result = buildAdvanceModalResponse(SAMPLE_QUESTS, config) as {
        type: number;
        data: { custom_id: string; title: string; components: unknown[] };
      };

      expect(result.type).toBe(InteractionResponseType.Modal);
      expect(result.data.custom_id).toBe("advance-modal");
      expect(result.data.title).toBe("Record Quest Progress");
      expect(result.data.components).toHaveLength(2);

      expect(result.data.components[0]).toMatchObject({
        type: ComponentType.Label,
        label: "Quest",
        component: {
          type: ComponentType.StringSelect,
          custom_id: "quest-select",
          placeholder: "Choose a quest...",
          options: [
            { label: "Main Quest", value: "q1", emoji: { name: "▶️" } },
            { label: "Subquest", value: "q2" },
          ],
        },
      });

      expect(result.data.components[1]).toMatchObject({
        type: ComponentType.Label,
        label: "Latest Progress",
        component: {
          type: ComponentType.TextInput,
          custom_id: "progress-input",
        },
      });
    });
  });

  describe("buildCompleteModalResponse", () => {
    const config: QuestCompleteModalConfig = {
      modalId: "complete-modal",
      questSelectId: "quest-select",
      resolutionInputId: "resolution-input",
    };

    it("returns modal with quest select, resolution input, and note", () => {
      const result = buildCompleteModalResponse(SAMPLE_QUESTS, config) as {
        type: number;
        data: { custom_id: string; components: unknown[] };
      };

      expect(result.type).toBe(InteractionResponseType.Modal);
      expect(result.data.custom_id).toBe("complete-modal");
      expect(result.data.components).toHaveLength(3);
      expect(result.data.components[2]).toMatchObject({
        type: ComponentType.TextDisplay,
        content:
          "Note: Completing a main quest will auto-complete all its subquests.",
      });
    });
  });

  describe("buildAddModalResponse", () => {
    const config: QuestAddModalConfig = {
      modalId: "add-modal-1",
      nameInputId: "name-input",
      progressInputId: "progress-input",
    };

    it("returns add quest modal with name and details inputs", () => {
      const result = buildAddModalResponse(config) as {
        type: number;
        data: { custom_id: string; title: string; components: unknown[] };
      };

      expect(result.type).toBe(InteractionResponseType.Modal);
      expect(result.data.custom_id).toBe("add-modal-1");
      expect(result.data.title).toBe("Add Quest");
      expect(result.data.components).toHaveLength(2);

      expect(result.data.components[0]).toMatchObject({
        type: ComponentType.Label,
        label: "Name",
        component: {
          type: ComponentType.TextInput,
          custom_id: "name-input",
          placeholder: "Slay the dragon of the vale",
        },
      });

      expect(result.data.components[1]).toMatchObject({
        type: ComponentType.Label,
        label: "Details",
        component: {
          type: ComponentType.TextInput,
          custom_id: "progress-input",
        },
      });
    });
  });

  describe("buildDeleteModalResponse", () => {
    const config: QuestDeleteModalConfig = {
      modalId: "delete-modal",
      questSelectId: "quest-select",
    };

    it("returns modal with quest select", () => {
      const result = buildDeleteModalResponse(SAMPLE_QUESTS, config) as {
        type: number;
        data: { custom_id: string; components: unknown[] };
      };

      expect(result.type).toBe(InteractionResponseType.Modal);
      expect(result.data.custom_id).toBe("delete-modal");
      expect(result.data.components[0]).toMatchObject({
        type: ComponentType.Label,
        label: "Quest",
        component: {
          type: ComponentType.StringSelect,
          custom_id: "quest-select",
        },
      });
    });
  });

  describe("buildClearModalResponse", () => {
    const config: QuestClearModalConfig = {
      modalId: "clear-modal",
      confirmInputId: "confirm-input",
    };

    it("returns modal with count in description", () => {
      const result = buildClearModalResponse(5, config) as {
        type: number;
        data: { custom_id: string; components: unknown[] };
      };

      expect(result.type).toBe(InteractionResponseType.Modal);
      expect(result.data.custom_id).toBe("clear-modal");
      expect(result.data.components[0]).toMatchObject({
        type: ComponentType.Label,
        label: "Confirmation",
        description:
          "This will permanently clear all 5 quests from your journal. Type 'clear' to confirm.",
        component: {
          type: ComponentType.TextInput,
          custom_id: "confirm-input",
          placeholder: "Type 'clear' to confirm",
        },
      });
    });
  });

  describe("buildSubquestModalResponse", () => {
    const config: QuestSubquestModalConfig = {
      modalId: "subquest-modal",
      parentQuestSelectId: "parent-select",
      nameInputId: "name-input",
      progressInputId: "progress-input",
    };

    it("returns modal with parent select and subquest inputs", () => {
      const topLevelQuests = [SAMPLE_QUESTS[0]];
      const result = buildSubquestModalResponse(topLevelQuests, config) as {
        type: number;
        data: { custom_id: string; components: unknown[] };
      };

      expect(result.type).toBe(InteractionResponseType.Modal);
      expect(result.data.custom_id).toBe("subquest-modal");
      expect(result.data.components).toHaveLength(3);
      expect(result.data.components[0]).toMatchObject({
        type: ComponentType.Label,
        label: "Parent Quest",
        component: {
          type: ComponentType.StringSelect,
          custom_id: "parent-select",
          placeholder: "Choose parent quest...",
          options: [{ label: "Main Quest", value: "q1", emoji: { name: "▶️" } }],
        },
      });
    });
  });
});
