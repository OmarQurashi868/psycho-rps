import create from "zustand";

type Play = "rock" | "paper" | "scissors" | undefined;

type UserStoreType = {
  name1?: string;
  setName1: (name: string) => void;
  name2?: string;
  setName2: (name: string) => void;
  isOwner: boolean;
  setIsOwner: (isOwner: boolean) => void;
  player1play?: Play;
  player2play?: Play;
  setPlayerPlay: (player: 1 | 2, play: Play) => void;
};

export const useUserStore = create<UserStoreType>((set) => ({
  name1: undefined,
  setName1: (name: string) => set({ name1: name }),
  name2: undefined,
  setName2: (name: string) => set({ name2: name }),
  isOwner: false,
  setIsOwner: (isOwner: boolean) => set({ isOwner }),
  player1play: undefined,
  player2play: undefined,
  setPlayerPlay(player, play) {
    if (player == 1) set({ player1play: play });
    if (player == 2) set({ player2play: play });
  },
}));
