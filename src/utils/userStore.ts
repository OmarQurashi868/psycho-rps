import { useMemo } from "react";
import create from "zustand";

type Play = "rock" | "paper" | "scissors" | true | undefined;

type Player = {
  userId?: string;
  name?: string;
  score?: number;
  play?: Play;
};

type Spectator = {
  userId?: string;
  name?: string;
};

type UserStoreType = {
  players: [Player, Player];
  setPlayer: (player: 0 | 1, data: Player) => void;
  setPlayerPlay: (player: 0 | 1, play: Play) => void;

  spectators: Spectator[];
  setSpectators: (spectators: Spectator[]) => void;
  clearSpectators: () => void;

  incrementPlayerScore: (player: 0 | 1) => void;
  clearPlayerScore: (player: 0 | 1) => void;

  isPlaying: -1 | 0 | 1 | 2;
  setIsPlaying: (isPlaying: -1 | 0 | 1 | 2) => void;

  myName: string | undefined;
  setMyName: (name: string | undefined) => void;
  myUserId: string | undefined;
  setMyUserId: (userId: string | undefined) => void;

  clearAllPlays: () => void;
  clearAllScores: () => void;

  clearAll: () => void;
};

export const useUserStore = create<UserStoreType>((set) => ({
  players: [{}, {}],
  setPlayer: (player: 0 | 1, data: Player) =>
    set((s) => {
      const newPlayers = s.players;
      Object.entries(data).forEach((entry) => {
        const [key, value] = entry;
        // eslint-disable-next-line
        // @ts-ignore
        newPlayers[player][key] = value;
      });
      return { players: newPlayers };
    }),
  setPlayerPlay: (player: 0 | 1, play: Play) =>
    set((s) => {
      const newPlayers = s.players;
      newPlayers[player].play = play;
      return { players: newPlayers };
    }),

  spectators: [],
  // addSpectator: (userId: string, name: string) =>
  //   set((s) => {
  //     const newSpectators = [...s.spectators, { userId: userId, name: name }];
  //     return { spectators: newSpectators };
  //   }),
  // removeSpectator: (userId: string) =>
  //   set((s) => {
  //     const newSpectators = s.spectators.filter((e) => e.userId != userId);
  //     return { spectators: newSpectators };
  //   }),
  setSpectators: (spectators: Spectator[]) => set({ spectators: spectators }),
  clearSpectators: () => set({ spectators: [] }),

  incrementPlayerScore: (player: 0 | 1) =>
    set((s) => {
      const newPlayers = s.players;
      newPlayers[player].score = newPlayers[player].score || 0 + 1;
      return { players: newPlayers };
    }),
  clearPlayerScore: (player: 0 | 1) =>
    set((s) => {
      const newPlayers = s.players;
      newPlayers[player].score = 0;
      return { players: newPlayers };
    }),

  isPlaying: -1,
  setIsPlaying: (player: -1 | 0 | 1 | 2) => set({ isPlaying: player }),
  playersPlays: { 1: undefined, 2: undefined },

  myName: "Default Name",
  setMyName: (name: string | undefined) => set({ myName: name }),
  myUserId: undefined,
  setMyUserId: (userId: string | undefined) => set({ myUserId: userId }),

  clearAllPlays: () =>
    set((s) => ({
      players: [{ name: s.players[0].name }, { name: s.players[1].name }],
    })),
  clearAllScores: () =>
    set((s) => ({
      players: [{ name: s.players[0].name }, { name: s.players[1].name }],
    })),

  clearAll: () => set({ players: [{}, {}], isPlaying: 1 }),
}));
