import {
  formatQuestList,
  formatCompletedQuestList,
  formatCompletedQuestForShowAll,
  formatAllQuestsList,
} from "./questsFormat";
import type { Quest } from "../dal/questsDAL";

function makeQuest(overrides: Partial<Quest> & { name: string }): Quest {
  return {
    id: "quest-1",
    channelId: "channel-1",
    progress: [],
    ...overrides,
  };
}

describe("formatQuestList", () => {
  it("returns message when no quests", () => {
    expect(formatQuestList([])).toBe("No active quests in your journal.");
  });

  it("formats a single quest without progress", () => {
    const quests = [makeQuest({ name: "Slay the dragon" })];
    expect(formatQuestList(quests)).toBe("## Slay the dragon");
  });

  it("formats a quest with one progress item", () => {
    const quests = [
      makeQuest({ name: "Slay the dragon", progress: ["Found the cave"] }),
    ];
    expect(formatQuestList(quests)).toBe(
      "## Slay the dragon\n*Found the cave*",
    );
  });

  it("formats a quest with multiple progress items (strikethrough all but last)", () => {
    const quests = [
      makeQuest({
        name: "Slay the dragon",
        progress: ["Found the cave", "Entered the cave", "Saw the dragon"],
      }),
    ];
    expect(formatQuestList(quests)).toBe(
      "## Slay the dragon\n~~*Found the cave*~~\n~~*Entered the cave*~~\n*Saw the dragon*",
    );
  });

  it("formats multiple quests", () => {
    const quests = [
      makeQuest({ name: "Quest A", progress: ["Step 1"] }),
      makeQuest({ name: "Quest B" }),
    ];
    expect(formatQuestList(quests)).toBe("## Quest A\n*Step 1*\n## Quest B");
  });

  it("formats main quest with subquests", () => {
    const quests = [
      makeQuest({ id: "main-1", name: "Main Quest", progress: ["Step 1"] }),
      makeQuest({
        id: "sub-1",
        name: "Subquest A",
        progress: ["Sub progress"],
        parentQuestId: "main-1",
      }),
      makeQuest({
        id: "sub-2",
        name: "Subquest B",
        parentQuestId: "main-1",
      }),
    ];
    expect(formatQuestList(quests)).toBe(
      "## Main Quest\n*Step 1*\n### Subquest A\n*Sub progress*\n### Subquest B",
    );
  });

  it("formats main quest with both active and completed subquests", () => {
    const active = [
      makeQuest({ id: "main-1", name: "Main Quest", progress: ["Step 1"] }),
      makeQuest({
        id: "sub-1",
        name: "Active Subquest",
        progress: ["In progress"],
        parentQuestId: "main-1",
      }),
    ];
    const completed = [
      makeQuest({
        id: "sub-2",
        name: "Completed Subquest",
        progress: ["Done"],
        parentQuestId: "main-1",
      }),
    ];
    expect(formatQuestList(active, completed)).toBe(
      "## Main Quest\n*Step 1*\n### Completed Subquest ✅\n*Done*\n### Active Subquest\n*In progress*",
    );
  });
});

describe("formatCompletedQuestList", () => {
  it("returns message when no quests", () => {
    expect(formatCompletedQuestList([])).toBe("No completed quests.");
  });

  it("formats a single completed quest without progress", () => {
    const quests = [makeQuest({ name: "Slay the dragon" })];
    expect(formatCompletedQuestList(quests)).toBe("## Slay the dragon ✅");
  });

  it("formats a completed quest with progress (resolution only)", () => {
    const quests = [
      makeQuest({
        name: "Slay the dragon",
        progress: ["Found cave", "Defeated dragon"],
      }),
    ];
    expect(formatCompletedQuestList(quests)).toBe(
      "## Slay the dragon ✅\n*Defeated dragon*",
    );
  });

  it("formats multiple completed quests", () => {
    const quests = [
      makeQuest({ name: "Quest A" }),
      makeQuest({ name: "Quest B", progress: ["Done"] }),
    ];
    expect(formatCompletedQuestList(quests)).toBe(
      "## Quest A ✅\n## Quest B ✅\n*Done*",
    );
  });

  it("formats completed main quest with subquests", () => {
    const quests = [
      makeQuest({
        id: "main-1",
        name: "Main Quest",
        progress: ["Resolution"],
        completed: true,
      }),
      makeQuest({
        id: "sub-1",
        name: "Subquest",
        progress: ["Done"],
        parentQuestId: "main-1",
        completed: true,
      }),
    ];
    expect(formatCompletedQuestList(quests)).toBe(
      "## Main Quest ✅\n*Resolution*\n### Subquest ✅\n*Done*",
    );
  });
});

describe("formatCompletedQuestForShowAll", () => {
  it("formats a completed quest with strikethrough on name and resolution only", () => {
    const quest = makeQuest({
      name: "Slay the dragon",
      progress: ["Found cave", "Defeated dragon"],
    });
    expect(formatCompletedQuestForShowAll(quest, false)).toBe(
      "## Slay the dragon ✅\n*Defeated dragon*",
    );
  });

  it("formats a completed quest without progress", () => {
    const quest = makeQuest({ name: "Quick quest" });
    expect(formatCompletedQuestForShowAll(quest, false)).toBe(
      "## Quick quest ✅",
    );
  });
});

describe("formatAllQuestsList", () => {
  it("returns message when no quests", () => {
    expect(formatAllQuestsList([], [])).toBe("Your quest log is empty.");
  });

  it("formats only active quests", () => {
    const active = [makeQuest({ name: "Active quest", progress: ["Step 1"] })];
    expect(formatAllQuestsList(active, [])).toBe("## Active quest\n*Step 1*");
  });

  it("formats only completed quests", () => {
    const completed = [
      makeQuest({ name: "Done quest", progress: ["Resolution"] }),
    ];
    expect(formatAllQuestsList([], completed)).toBe(
      "## Done quest ✅\n*Resolution*",
    );
  });

  it("formats both active and completed quests", () => {
    const active = [makeQuest({ name: "Active", progress: ["In progress"] })];
    const completed = [makeQuest({ name: "Done", progress: ["Resolved"] })];
    expect(formatAllQuestsList(active, completed)).toBe(
      "## Done ✅\n*Resolved*\n## Active\n*In progress*",
    );
  });

  it("formats multiple of each type", () => {
    const active = [
      makeQuest({ name: "Active 1" }),
      makeQuest({ name: "Active 2", progress: ["Step"] }),
    ];
    const completed = [
      makeQuest({ name: "Done 1" }),
      makeQuest({ name: "Done 2", progress: ["End"] }),
    ];
    const result = formatAllQuestsList(active, completed);
    expect(result).toContain("## Active 1");
    expect(result).toContain("## Active 2");
    expect(result).toContain("## Done 1 ✅");
    expect(result).toContain("## Done 2 ✅");
  });

  it("shows completed subquests under active main quest", () => {
    const active = [
      makeQuest({
        id: "main-1",
        name: "Active Main",
        progress: ["Step 1"],
      }),
      makeQuest({
        id: "sub-1",
        name: "Active Sub",
        progress: ["Working"],
        parentQuestId: "main-1",
      }),
    ];
    const completed = [
      makeQuest({
        id: "sub-2",
        name: "Finished Sub",
        progress: ["Resolved"],
        parentQuestId: "main-1",
      }),
    ];
    const result = formatAllQuestsList(active, completed);
    expect(result).toContain("## Active Main");
    expect(result).toContain("### Active Sub");
    expect(result).toContain("### Finished Sub ✅");
    expect(result).toContain("*Resolved*");
  });
});
