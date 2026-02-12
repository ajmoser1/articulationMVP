import { EXERCISES, getExerciseById } from "@/data/exercises";
import type { ExerciseConfig, UserProgress } from "@/types/exercise";

const IMPLEMENTED_EXERCISE_IDS = new Set<string>(["filler-words", "impromptu-response"]);

export function isExerciseImplemented(exerciseId: string): boolean {
  return IMPLEMENTED_EXERCISE_IDS.has(exerciseId);
}

export function getImplementedExercises(): ExerciseConfig[] {
  return EXERCISES.filter((exercise) => isExerciseImplemented(exercise.id));
}

export function getPlaceholderExercises(): ExerciseConfig[] {
  return EXERCISES.filter((exercise) => !isExerciseImplemented(exercise.id));
}

export function canUserAccessExercise(exerciseId: string, _userProgress?: UserProgress | null): boolean {
  const exercise = getExerciseById(exerciseId);
  if (!exercise) return false;
  return true;
}
