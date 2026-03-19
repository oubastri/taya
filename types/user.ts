import type { Workout } from './workout';

export type ProfilePrompt = {
  question: string;
  answer: string;
};

export const PROMPT_OPTIONS = [
  "If I had to pick one workout for life",
  "Currently chasing",
  "Go to post-workout meal",
  "On rest days, you'll find me",
] as const;

export type User = {
  id: string;
  name: string;
  handle: string;
  bio?: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  followersCount?: number;
  location?: string;
  tagline?: string;
  prompts?: ProfilePrompt[];
};

export type FriendData = User & {
  workouts: Workout[];
  following: boolean;
};
