export type LikeState = {
  count: number;
  likedByMe: boolean;
};

export type LikePerson = {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  /** Present when list is shown in-app (e.g. athletes search). */
  following?: boolean;
};
