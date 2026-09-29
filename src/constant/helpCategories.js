// Help Centre categories, mirrored from the mobile catalog
// (apps/mobile/App/Components/SupportChatBubble/helpTopics.ts HELP_CATEGORIES).
// `value` is what is stored in faqs.category. An FAQ with no category shows
// under "Other questions" in the app.
export const HELP_CATEGORIES = [
  { value: "getting-started", label: "Getting started (login, account, profile)" },
  { value: "teams", label: "Teams & roster" },
  { value: "events", label: "Events & schedule" },
  { value: "live-scoring", label: "Live scoring" },
  { value: "music", label: "DJ, music & voices" },
  { value: "chat", label: "Chat & carpool" },
  { value: "parents", label: "Parent Hub (calendar, kid alerts, stats, volunteering)" },
  { value: "billing", label: "Make Plays Pro (billing)" },
  { value: "fees", label: "Team fees" },
  { value: "troubleshooting", label: "Privacy & troubleshooting" },
  { value: "more", label: "Other questions" },
];

export const helpCategoryLabel = (value) =>
  HELP_CATEGORIES.find((c) => c.value === value)?.label ?? "Other questions";

// Shared field help for Add/Edit FAQ. The app splits an answer into numbered
// step cards when lines start with "1." "2." "3." — one instruction per line.
export const ANSWER_STEPS_HINT =
  "Write one step per line starting with 1. 2. 3. and the app shows them as numbered step cards. " +
  "A plain paragraph shows as a single answer. Use the exact question of a built-in help topic to replace its answer.";
