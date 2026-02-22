import type { Quest } from "../dal/questsDAL";

function formatQuestWithProgress(quest: Quest, isSubquest: boolean): string {
  const header = isSubquest ? `### ${quest.name}` : `## ${quest.name}`;
  const progressLines = quest.progress.map((p, i) => {
    const isLast = i === quest.progress.length - 1;
    const italicized = `*${p}*`;
    return isLast ? italicized : `~~${italicized}~~`;
  });
  const progressBlock =
    progressLines.length > 0 ? "\n" + progressLines.join("\n") : "";
  return `${header}${progressBlock}`;
}

/**
 * Formats active quests and completed subquests as markdown for display.
 *
 * @param quests - Active quests
 * @param completedQuests - Completed quests (used for completed subquests under active parents)
 * @returns Formatted markdown string
 */
export function formatQuestList(
  quests: Quest[],
  completedQuests: Quest[] = [],
): string {
  if (quests.length === 0) return "No active quests in your journal.";
  const topLevel = quests.filter((q) => !q.parentQuestId);
  const lines: string[] = [];
  for (const main of topLevel) {
    lines.push(formatQuestWithProgress(main, false));
    const activeSubquests = quests.filter((q) => q.parentQuestId === main.id);
    const completedSubquests = completedQuests.filter(
      (q) => q.parentQuestId === main.id,
    );
    for (const sub of completedSubquests) {
      lines.push(formatCompletedQuestForShowAll(sub, true));
    }
    for (const sub of activeSubquests) {
      lines.push(formatQuestWithProgress(sub, true));
    }
  }
  return lines.join("\n");
}

function formatCompletedQuest(quest: Quest, isSubquest: boolean): string {
  const header = isSubquest ? `### ${quest.name} ✅` : `## ${quest.name} ✅`;
  const resolution =
    quest.progress.length > 0
      ? quest.progress[quest.progress.length - 1]
      : null;
  const progressBlock = resolution ? `\n*${resolution}*` : "";
  return `${header}${progressBlock}`;
}

/**
 * Formats completed quests as markdown (with checkmark and resolution).
 *
 * @param quests - Completed quests
 * @returns Formatted markdown string
 */
export function formatCompletedQuestList(quests: Quest[]): string {
  if (quests.length === 0) return "No completed quests.";
  const topLevel = quests.filter((q) => !q.parentQuestId);
  const lines: string[] = [];
  for (const main of topLevel) {
    lines.push(formatCompletedQuest(main, false));
    const subquests = quests.filter((q) => q.parentQuestId === main.id);
    for (const sub of subquests) {
      lines.push(formatCompletedQuest(sub, true));
    }
  }
  return lines.join("\n");
}

/**
 * Formats a single completed quest as markdown (header + resolution).
 *
 * @param quest - Completed quest
 * @param isSubquest - Whether to use subquest (###) or main quest (##) heading
 * @returns Formatted markdown string
 */
export function formatCompletedQuestForShowAll(
  quest: Quest,
  isSubquest: boolean,
): string {
  const header = isSubquest ? `### ${quest.name} ✅` : `## ${quest.name} ✅`;
  const resolution =
    quest.progress.length > 0
      ? quest.progress[quest.progress.length - 1]
      : null;
  const progressBlock = resolution ? `\n*${resolution}*` : "";
  return `${header}${progressBlock}`;
}

/**
 * Formats all quests (active and completed) as markdown, grouped by parent.
 *
 * @param activeQuests - Active quests
 * @param completedQuests - Completed quests
 * @returns Formatted markdown string
 */
export function formatAllQuestsList(
  activeQuests: Quest[],
  completedQuests: Quest[],
): string {
  const activeTopLevel = activeQuests.filter((q) => !q.parentQuestId);
  const activeLines: string[] = [];
  for (const main of activeTopLevel) {
    activeLines.push(formatQuestWithProgress(main, false));
    const activeSubquests = activeQuests.filter(
      (q) => q.parentQuestId === main.id,
    );
    const completedSubquests = completedQuests.filter(
      (q) => q.parentQuestId === main.id,
    );
    for (const sub of completedSubquests) {
      activeLines.push(formatCompletedQuestForShowAll(sub, true));
    }
    for (const sub of activeSubquests) {
      activeLines.push(formatQuestWithProgress(sub, true));
    }
  }
  const activePart = activeLines.join("\n");

  const completedTopLevel = completedQuests.filter((q) => !q.parentQuestId);
  const completedLines: string[] = [];
  for (const main of completedTopLevel) {
    completedLines.push(formatCompletedQuestForShowAll(main, false));
    const subquests = completedQuests.filter(
      (q) => q.parentQuestId === main.id,
    );
    for (const sub of subquests) {
      completedLines.push(formatCompletedQuestForShowAll(sub, true));
    }
  }
  const completedPart = completedLines.join("\n");

  const parts = [completedPart, activePart].filter(Boolean);
  if (parts.length === 0) return "Your quest log is empty.";
  return parts.join("\n");
}
