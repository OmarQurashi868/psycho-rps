import create from "zustand";

type Play = "rock" | "paper" | "scissors" | undefined;
type Player = {
  name?: string;
  play?: Play;
};

type UserStoreType = {
  players: [Player, Player];
  setPlayerNames: (player: 0 | 1, name: string) => void;
  currentPlayer: 0 | 1;
  setCurrentPlayer: (player: 0 | 1) => void;
  setPlayerPlay: (player: 0 | 1, play: Play) => void;
  clearPlayersPlays: () => void;
  clearAll: () => void;
};

export const useUserStore = create<UserStoreType>((set) => ({
  players: [{}, {}],
  setPlayerNames: (player: 0 | 1, name: string) =>
    set((s) => {
      const newPlayers = s.players;
      newPlayers[player].name = name;
      return { players: newPlayers };
    }),
  currentPlayer: 1,
  setCurrentPlayer: (player: 0 | 1) => set({ currentPlayer: player }),
  playersPlays: { 1: undefined, 2: undefined },
  setPlayerPlay: (player: 0 | 1, play: Play) =>
    set((s) => {
      const newPlayers = s.players;
      newPlayers[player].play = play;
      return { players: newPlayers };
    }),
  clearPlayersPlays: () =>
    set((s) => ({
      players: [{ name: s.players[0].name }, { name: s.players[1].name }],
    })),
  clearAll: () => set({ players: [{}, {}], currentPlayer: undefined }),
}));
