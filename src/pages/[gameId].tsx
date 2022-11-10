import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Pusher from "pusher-js";
import { env } from "../env/client.mjs";
import Head from "next/head.js";
import { useUserStore } from "../utils/userStore";
import { trpc } from "../utils/trpc";
import { Events, UserJoinType } from "../constants/events";
import { eventNames } from "process";

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
  const [isLoading, setIsLoading] = useState(true);

  // Connect websocket pusher
  const pusherMemo = useMemo(() => {
    if (typeof gameId == "string") {
      const pusher = new Pusher(env.NEXT_PUBLIC_APP_KEY, { cluster: "eu" });
      const channel = pusher.subscribe(gameId);
      return { pusher: pusher, channel: channel };
    }
  }, [gameId]);

  // Mutations
  const { mutate: getInfo } = trpc.gameRouter.getInfo.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("lastGameId", data?.gameName);
      console.log(data)
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
      if (data?.spectators.length > 0) {
        setSpectators(data?.spectators);
      }
      setIsLoading(false);
    },
    onError: () => {
      router.push("/");
    },
  });
  const { mutate: join } = trpc.gameRouter.join.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("lastGameId", data?.gameName);
      localStorage.setItem("userId", data.userId);
      setMyUserId(data.userId);
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
      if (data?.spectators.length > 0) {
        setSpectators(data?.spectators);
      }
      setIsLoading(false);
    },
  });
  const { mutate: sendPlay } = trpc.gameRouter.play.useMutation();

  // On join form submit
  const joinHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (typeof gameId == "string") localStorage.setItem("lastGameId", gameId);
  };

  // TODO: UI for different page states
  // Loading screen
  const loadingScreen = <>LOADING...</>;
  // Input name screen
  const inputNameScreen = <>INPUT YOUR NAME</>;
  // Waiting for other player screen
  const waitingOtherPlayerScreen = (
    <>
      WAITING FOR OTHER PLAYER
      <br />
      {players[0].name ?? "WAITING"}
      <br />
      {players[1].name ?? "WAITING"}
    </>
  );
  // Game screen
  const gameScreen = (
    <>
      Game
      <br />
      {players[0].name}
      <br />
      {players[1].name}
    </>
  );
  const [content, setContent] = useState(waitingOtherPlayerScreen);

  // Function to check if spectator already exists in array
  const spectatorExists = (userId: string | undefined) => {
    if (!userId) return false;
    let count = 0;
    spectators.forEach((e) => {
      if (e.userId == userId) {
        count++;
      }
    });
    return count > 0;
  };

  // On page load
  useEffect(() => {
    setMyUserId(localStorage.getItem("userId") || undefined);
    // Get game info
    if (gameId && typeof gameId == "string")
      getInfo({
        gameName: gameId,
      });
    setIsLoading(true);
    console.log(players)
    console.log("useeffect")
    // Joining as player or spectator logic
    if (!players[0].userId || !players[1].userId) {
      console.log("player spot open check")
      // Check if current user already exists
      if (
        (players[0].userId != undefined && players[0].userId == myUserId) ||
        (players[1].userId != undefined && players[1].userId == myUserId)
      ) {
        console.log("user already exists")
        // Show waiting for other player screen
        setContent(waitingOtherPlayerScreen);
      } else if (!players[0].userId) {
        console.log("joining as player 1")
        // Join as player 1
        if (localStorage.getItem("lastGameId") != gameId) {
          // TODO: Ask for name
        }
        // Mutate Join
        if (typeof gameId == "string")
          join({
            userId: myUserId,
            name: myName || "Default Name",
            gameName: gameId,
          });
        setIsPlaying(1);
      } else if (!players[1].userId) {
        console.log("joining as player 2")
        // Join as player 2
        if (localStorage.getItem("lastGameId") != gameId) {
          // TODO: Ask for name
        }
        // Mutate join
        if (typeof gameId == "string")
          join({
            userId: myUserId,
            name: myName || "Default Name",
            gameName: gameId,
          });

        setIsPlaying(2);
      }
    } else if (!spectatorExists(myUserId)) {
      console.log("player spot full")
      setContent(gameScreen);
      // Spectate if user is not already spectating
      if (localStorage.getItem("lastGameId") != gameId) {
        // TODO: Ask for name
      }
      if (typeof gameId == "string")
        join({
          userId: myUserId,
          name: myName || "Default Name",
          gameName: gameId,
        });
      setIsPlaying(0);
    }

    // Other players join event listener
    pusherMemo?.channel.bind(Events.USER_JOIN, (data: UserJoinType) => {
      if (data?.game?.players[0]) {
        setPlayer(0, {
          name: data.game.players[0].name,
          userId: data.game.players[0].id,
          score: data.game.players[0].score || 0,
        });
      }
      if (data?.game?.players[1]) {
        setPlayer(0, {
          name: data.game.players[1].name,
          userId: data.game.players[1].id,
          score: data.game.players[1].score || 0,
        });
      }
      if (data?.game?.spectators.length > 0) {
        setSpectators(data?.game?.spectators);
      }
      if (gameId && typeof gameId == "string")
        getInfo({
          gameName: gameId,
        });
    });
  }, [gameId, players[0], players[1], spectators, myName]);

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
        name: players[isPlaying - 1]?.name || "Default Name",
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
        {isLoading ? loadingScreen : content}
      </main>
    </>
  );
};

export default Game;
