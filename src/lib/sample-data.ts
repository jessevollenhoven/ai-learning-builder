// Keeps all prototype activity and quiz content in one place.
import type { MultipleChoiceContent, TrueFalseContent } from "./schemas";

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

export const sampleTrueFalseQuiz: TrueFalseContent = {
  type: "true_false",
  title: "Water cycle facts",
  instructions: "Decide whether each statement is true or false.",
  statements: [
    { statement: "The Sun provides energy that drives evaporation.", answer: true, explanation: "Solar energy warms water and helps it evaporate." },
    { statement: "Condensation turns water vapor into liquid droplets.", answer: true, explanation: "Cooling vapor condenses into tiny liquid water droplets." },
    { statement: "Precipitation only means rain.", answer: false, explanation: "Precipitation also includes snow, sleet, and hail." },
    { statement: "Plants release water vapor through transpiration.", answer: true, explanation: "Plants release water vapor from their leaves." },
    { statement: "The water cycle has a fixed starting point.", answer: false, explanation: "The water cycle is continuous, so it has no single starting point." },
  ],
};

export function getRefinedSampleQuiz(): MultipleChoiceContent {
  return { ...sampleQuiz, title: `${sampleQuiz.title} (refined)` };
}