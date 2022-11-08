export enum Events {
  USER_JOIN = "join",
  USER_PLAY = "play",
}

export type UserJoinType = {
  userId: string;
  name: string;
};
