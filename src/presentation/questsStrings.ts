/**
 * User-facing strings and presentation constants for quest-related responses.
 */

export const MAIN_QUEST_EMOJI = { name: "▶️" } as const;

export const STRINGS = {
  noQuestsAvailable: "No quests available. Create a quest first.",
  noQuestsToComplete: "No quests available to complete.",
  noQuestsToDelete: "No quests in your journal to delete.",
  noTopLevelQuests: "No top-level quests available. Create a quest first.",
  questLogEmpty: "Your quest log is already empty.",

  advanceModalTitle: "Record Quest Progress",
  advanceModalQuestLabel: "Quest",
  advanceModalQuestDescription: "Choose a quest to record progress on",
  advanceModalProgressLabel: "Latest Progress",
  advanceModalProgressDescription: "Describe the progress you've made",
  advanceModalProgressPlaceholder:
    "We ventured into the ancient crypt and discovered...",

  completeModalTitle: "Complete Quest",
  completeModalQuestLabel: "Quest",
  completeModalQuestDescription: "Choose a quest to complete",
  completeModalResolutionLabel: "Resolution",
  completeModalResolutionDescription: "How did the quest conclude?",
  completeModalResolutionPlaceholder: "We have slain the dragon of the vale",
  completeModalNote:
    "Note: Completing a main quest will auto-complete all its subquests.",

  addModalTitle: "Add Quest",
  addModalNameLabel: "Name",
  addModalDetailsLabel: "Details",
  addModalDetailsDescription: "How did this quest begin? (optional)",
  addModalNamePlaceholder: "Slay the dragon of the vale",
  addModalDetailsPlaceholder:
    "The tavern keeper pointed us toward the mountain...",

  deleteModalTitle: "Delete Quest",
  deleteModalQuestLabel: "Quest",
  deleteModalQuestDescription:
    "Choose a quest to remove from your journal (subquests will be removed too)",

  clearModalTitle: "Clear All Quests?",
  clearModalLabel: "Confirmation",
  clearModalPlaceholder: "Type 'clear' to confirm",
  clearModalDescription: (count: number) =>
    `This will permanently clear all ${count} quests from your journal. Type 'clear' to confirm.`,

  subquestModalTitle: "Add Subquest",
  subquestModalParentLabel: "Parent Quest",
  subquestModalParentDescription: "Choose the quest to add a subquest to",
  subquestModalNameLabel: "Name",
  subquestModalDetailsLabel: "Details",
  subquestModalDetailsDescription: "How did this subquest begin? (optional)",
  subquestModalNamePlaceholder: "Retrieve the enchanted blade",
  subquestModalDetailsPlaceholder:
    "We heard whispers of a blade in the ruins...",

  questSelectPlaceholder: "Choose a quest...",
  parentQuestPlaceholder: "Choose parent quest...",

  questAdded: (name: string) => `Quest "${name}" added to your journal!`,
  subquestAdded: (name: string) => `Subquest "${name}" added to your journal!`,
  adventureProgressLogged: "Adventure progress logged!",
  questCompleted: "Quest completed successfully!",
  questRemoved: "Quest removed from your journal.",
  questsCleared: (count: number) =>
    `Cleared ${count} quests from your journal.`,
  questNotFound: "Quest not found. Please try again.",
} as const;
