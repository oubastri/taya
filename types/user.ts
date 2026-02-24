import type { Workout } from './workout';

export type User = {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
};

export type FriendData = User & {
  workouts: Workout[];
  following: boolean;
};
