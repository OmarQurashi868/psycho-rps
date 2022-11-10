export enum Events {
  USER_JOIN = "join",
  USER_PLAY = "play",
}

type Player = {
  id: string;
  name: string;
  score?: number;
};

export type UserJoinType = {
  game: {
    id: string;
    gameName: string;
    players: Player[];
    spectators: Player[];
  };
};
