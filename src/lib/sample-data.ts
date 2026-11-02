// Keeps all prototype activity and quiz content in one place.
export const activityTypes = [
  "Multiple choice",
  "True / false",
  "Flashcards",
  "Matching",
  "Ordering",
] as const;

export type ActivityType = (typeof activityTypes)[number];

export const sampleActivities: {
  title: string;
  type: ActivityType;
  date: string;
  dateLabel: string;
}[] = [
  { title: "The water cycle", type: "Multiple choice", date: "2026-10-28", dateLabel: "Oct 28, 2026" },
  { title: "Fractions in everyday life", type: "Flashcards", date: "2026-10-24", dateLabel: "Oct 24, 2026" },
  { title: "Early space exploration", type: "Ordering", date: "2026-10-19", dateLabel: "Oct 19, 2026" },
  { title: "Parts of a plant cell", type: "Matching", date: "2026-10-12", dateLabel: "Oct 12, 2026" },
  { title: "Ancient Greece: quick check", type: "True / false", date: "2026-10-08", dateLabel: "Oct 8, 2026" },
];

export const sampleQuiz = {
  title: "The water cycle",
  questions: [
    {
      prompt: "What is the process called when liquid water changes into water vapor?",
      choices: ["Condensation", "Evaporation", "Precipitation", "Collection"],
      answerIndex: 1,
    },
    {
      prompt: "What happens when water vapor cools and forms tiny droplets?",
      choices: ["Runoff", "Infiltration", "Condensation", "Evaporation"],
      answerIndex: 2,
    },
    {
      prompt: "Which is an example of precipitation?",
      choices: ["Rain falling from clouds", "A puddle drying in the sun", "Fog forming", "Water flowing into a lake"],
      answerIndex: 0,
    },
    {
      prompt: "What provides most of the energy that drives the water cycle?",
      choices: ["The Moon", "Wind", "The Sun", "Ocean currents"],
      answerIndex: 2,
    },
  ],
} as const;