/**
 * Database of opinion and analysis questions for the Impromptu Response exercise.
 * Each question requires the user to state a position and support it with reasoning.
 */

export const IMPROMPTU_QUESTIONS: readonly string[] = [
  "Do you think remote work will become the norm for most companies? Why or why not?",
  "Is it more important to be liked or respected? Explain your reasoning.",
  "Should social media companies be held responsible for misinformation?",
  "What is the single most important quality in a leader?",
  "Are there situations where lying is acceptable? If so, when?",
  "Should colleges prioritize practical skills over theoretical knowledge?",
  "Is artificial intelligence more of a threat or an opportunity for humanity?",
  "Does success come more from talent or from hard work?",
  "Should people be encouraged to pursue their passion even if it pays poorly?",
  "Is it better to make decisions quickly or take time to deliberate?",
  "Should governments limit screen time for children?",
  "What role should competition play in education?",
  "Is creativity something that can be taught, or is it innate?",
  "Should companies be required to disclose their environmental impact?",
  "Does technology bring people together or push them apart?",
  "Is it more important to be right or to be kind when you disagree?",
  "Should everyone be required to vote?",
  "What makes a product or service worth paying a premium for?",
  "Is failure a necessary part of success?",
  "Should businesses prioritize profit or social responsibility?",
  "What is the biggest misconception people have about your field of work?",
  "Would you rather have more time or more money? Why?",
  "Is it possible to separate an artist's work from their personal life?",
  "What is the most overrated piece of advice you've received?",
  "Should people change to fit their environment, or try to change the environment?",
];

/**
 * Returns a random question from the database.
 */
export function getRandomImpromptuQuestion(): string {
  const index = Math.floor(Math.random() * IMPROMPTU_QUESTIONS.length);
  return IMPROMPTU_QUESTIONS[index];
}
