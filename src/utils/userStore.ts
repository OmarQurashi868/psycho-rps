import { useMemo } from "react";
import create from "zustand";

type Play = "rock" | "paper" | "scissors" | undefined;

type Player = {
  userId?: string;
  name?: string;
  score?: number;
  play?: Play;
};

type UserStoreType = {
  players: [Player, Player];
  setPlayer: (player: 0 | 1, data: Player) => void;
  setPlayerPlay: (player: 0 | 1, play: Play) => void;

  incrementPlayerScore: (player: 0 | 1) => void;
  clearPlayerScore: (player: 0 | 1) => void;

  isPlaying: 0 | 1 | 2;
  setIsPlaying: (isPlaying: 0 | 1 | 2) => void;

  myName: string;
  setMyName: (name: string) => void;

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

  isPlaying: 1,
  setIsPlaying: (player: 0 | 1 | 2) => set({ isPlaying: player }),
  playersPlays: { 1: undefined, 2: undefined },

  myName: "",
  setMyName: (name: string) => set({ myName: name }),

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
