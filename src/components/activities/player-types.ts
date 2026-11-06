// Shares the small renderer contract used by registered activity players.
export type ActivityQuestion = {
  prompt: string;
  options?: string[];
  correctAnswer: number | boolean;
  explanation: string;
};

export type ActivityPlayerProps = {
  question: ActivityQuestion;
  selectedAnswer: number | boolean | null;
  disabled: boolean;
  onSelectAnswer: (answer: number | boolean) => void;
};