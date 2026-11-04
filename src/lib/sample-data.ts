// Keeps all prototype activity and quiz content in one place.
import type { MultipleChoiceContent } from "./schemas";

export const activityTypes = [
  "Multiple choice",
  "True / false",
  "Flashcards",
  "Matching",
  "Ordering",
] as const;

export type ActivityType = (typeof activityTypes)[number];

export const sampleQuiz: MultipleChoiceContent = {
  type: "multiple_choice",
  title: "The water cycle",
  instructions: "Choose the best answer for each question. Read the explanation after you check your answer.",
  questions: [
    {
      question: "What is the process called when liquid water changes into water vapor?",
      options: ["Condensation", "Evaporation", "Precipitation", "Collection"],
      correctIndex: 1,
      explanation: "Evaporation changes liquid water into water vapor, usually as it warms.",
    },
    {
      question: "What happens when water vapor cools and forms tiny droplets?",
      options: ["Runoff", "Infiltration", "Condensation", "Evaporation"],
      correctIndex: 2,
      explanation: "Condensation turns water vapor into liquid droplets, such as those in clouds.",
    },
    {
      question: "Which is an example of precipitation?",
      options: ["Rain falling from clouds", "A puddle drying in the sun", "Fog forming", "Water flowing into a lake"],
      correctIndex: 0,
      explanation: "Precipitation is water that falls from clouds, including rain, snow, sleet, or hail.",
    },
    {
      question: "What provides most of the energy that drives the water cycle?",
      options: ["The Moon", "Wind", "The Sun", "Ocean currents"],
      correctIndex: 2,
      explanation: "The Sun warms water and drives evaporation, powering much of the water cycle.",
    },
    {
      question: "Where does water collect after it flows over land?",
      options: ["In rivers and lakes", "Inside clouds", "Only underground", "In the upper atmosphere"],
      correctIndex: 0,
      explanation: "Runoff carries water across land into streams, rivers, lakes, and eventually oceans.",
    },
  ],
};

export function getRefinedSampleQuiz(): MultipleChoiceContent {
  return { ...sampleQuiz, title: `${sampleQuiz.title} (refined)` };
}