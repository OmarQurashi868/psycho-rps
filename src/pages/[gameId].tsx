import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import Pusher from "pusher-js";
import { env } from "../env/client.mjs";
import Head from "next/head.js";
import { useUserStore } from "../utils/userStore";
import { trpc } from "../utils/trpc";
import { Events } from "../constants/events";

const Game = () => {
  const router = useRouter();
  const { gameId } = router.query;
  const {
    players,
    isPlaying,
    setIsPlaying,
    setPlayer,
    setPlayerPlay,
    clearAllPlays,
    myName,
    myUserId,
    setMyUserId,
    spectators,
    setSpectators,
  } = useUserStore();

  // Connect websocket pusher
  const pusherMemo = useMemo(() => {
    if (typeof gameId == "string") {
      const pusher = new Pusher(env.NEXT_PUBLIC_APP_KEY, { cluster: "eu" });
      const channel = pusher.subscribe(gameId);
      return { pusher: pusher, channel: channel };
    }
  }, [gameId]);

  // Mutations
  const { mutate: getInfo, isLoading: getInfoLoading } =
    trpc.gameRouter.getInfo.useMutation({
      onSuccess: (data) => {
        console.log(data);
        localStorage.setItem("lastGameId", data?.gameName!);
        if (data?.players[0]) {
          setPlayer(0, {
            name: data.players[0].name,
            userId: data.players[0].id,
            score: data.players[0].score || 0,
          });
        }
        if (data?.players[1]) {
          setPlayer(0, {
            name: data.players[1].name,
            userId: data.players[1].id,
            score: data.players[1].score || 0,
          });
        }
        if (data?.spectators.length! > 0) {
          setSpectators(data?.spectators!);
        }
        console.log(players);
      },
      onError: () => {
        router.push("/");
      },
    });
  const { mutate: join } = trpc.gameRouter.join.useMutation();
  const { mutate: sendPlay } = trpc.gameRouter.play.useMutation();

  // On join form submit
  const joinHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (typeof gameId == "string") localStorage.setItem("lastGameId", gameId);
  };

  // TODO: UI for different page states
  let content = <>LOADING</>;
  // Input name screen
  const inputNameScreen = <>INPUT YOUR NAME</>;
  // Waiting for other player screen
  const waitingOtherPlayerScreen = <>WAITING FOR OTHER PLAYER</>;
  // Game screen
  const gameScreen = <>Game</>;

  // On page load
  useEffect(() => {
    setMyUserId(localStorage.getItem("userId") || undefined);
    // Get game info
    getInfo({
      gameId: typeof gameId == "string" ? gameId : "",
    });
    // Joining as player or spectator logic
    if (!players[0].userId || !players[1].userId) {
      // Check if current user already exists
      if (players[0].userId == myUserId || players[1].userId == myUserId) {
        // Show waiting for other player screen
        content = waitingOtherPlayerScreen;
      } else if (!players[0].userId) {
        // Join as player 1
        if (localStorage.getItem("lastGameId") == gameId) {
          // Join as same user
          // Mutate join with userId and name
          join({
            userId: myUserId,
            name: myName || "Default Name",
            gameId: gameId,
          });
        } else {
          // Join as new user
          // TODO: Ask for name
          // Mutate join with new name
          if (typeof gameId == "string")
            join({
              userId: myUserId,
              name: myName || "Default Name",
              gameId: gameId,
            });
        }
        setIsPlaying(1);
      } else if (!players[1].userId) {
        // Join as player 2
        if (localStorage.getItem("lastGameId") == gameId) {
          // Join as same user
          // Mutate join with userId and name
          join({
            userId: myUserId,
            name: myName || "Default Name",
            gameId: gameId,
          });
        } else {
          // Join as new user
          // TODO: Ask for name
          // Mutate join with new name
          if (typeof gameId == "string")
            join({
              userId: myUserId,
              name: myName || "Default Name",
              gameId: gameId,
            });
        }
        setIsPlaying(2);
      }
    } else {
      // Spectate
      if (typeof gameId == "string")
        join({
          userId: myUserId,
          name: myName || "Default Name",
          gameId: gameId,
        });
      setIsPlaying(0);
    }

    // TODO: Other players join event listener
  }, [gameId, players, spectators]);

  // Functions that runs when plays are decided
  const playerWin = (player: 0 | 1) => {
    alert(`${players[player].name} WINS!`);
  };
  const playerDraw = () => {
    alert("DRAW!!!");
  };

  // Rock papers scissors logic
  useEffect(() => {
    // TODO: Move plays to server side
    // When both plays are decided
    if (players[0].play && players[1].play) {
      if (players[0].play == players[1].play) {
        playerDraw();
      }

      const winSet = ["rock", "paper", "scissors"];
      const loseSet = ["scissors", "rock", "paper"];

      for (let i = 0; i < winSet.length; i++) {
        if (players[0].play == winSet[i] && players[1].play == loseSet[i]) {
          playerWin(0);
          break;
        }
        if (players[1].play == winSet[i] && players[0].play == loseSet[i]) {
          playerWin(1);
          break;
        }
      }

      // Clear all plays
      clearAllPlays();
    }
  }, [players[0].play, players[1].play]);

  // Push play to API
  const pickPlay = (play: "rock" | "paper" | "scissors") => {
    if (typeof gameId == "string" && isPlaying != 0 && myUserId)
      sendPlay({
        userId: myUserId,
        name: players[isPlaying - 1]?.name!,
        isPlaying: isPlaying - 1,
        gameId: gameId,
        play,
      });
  };

  return (
    <>
      <Head>
        <title>{`rps-${gameId}`}</title>
        <meta name="description" content="Test game to learn websockets!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-24 p-4">
        {" "}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="fixed top-5 left-10 h-12 w-12 cursor-pointer duration-100 ease-in-out hover:h-16 hover:w-16"
          onClick={() => router.push("/")}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
        {content}
      </main>
    </>
  );
};

export default Game;
