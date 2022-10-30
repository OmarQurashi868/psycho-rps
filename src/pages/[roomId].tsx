import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import Pusher from "pusher-js";
import { env } from "../env/client.mjs";
import Head from "next/head.js";
import { useUserStore } from "../utils/userStore";
import { trpc } from "../utils/trpc";
import { Events } from "../constants/events";

const Room = () => {
  const router = useRouter();
  const { roomId } = router.query;
  const {
    players,
    setPlayerNames,
    currentPlayer,
    setCurrentPlayer,
    setPlayerPlay,
    clearPlayersPlays,
  } = useUserStore();

  const pusherMemo = useMemo(() => {
    if (typeof roomId == "string") {
      const pusher = new Pusher(env.NEXT_PUBLIC_APP_KEY, { cluster: "eu" });
      const channel = pusher.subscribe(roomId);
      return { pusher: pusher, channel: channel };
    }
  }, [roomId]);

  const joinMutation = trpc.gameRouter.join.useMutation();

  // TODO: Fix screen disappearing on alert
  // TODO: Refactor to allow asking for lobby info and enable spectating when joining 2 or more players

  useEffect(() => {
    if (pusherMemo) {
      if (typeof roomId == "string") localStorage.setItem("lastRoomId", roomId)
      pusherMemo.channel.bind(Events.USER_JOIN, (data: any) => {
        
        // on player 1 reciving join event
        if (!currentPlayer && typeof roomId == "string" && !players[1].name) {
          setPlayerNames(1, data.name);
          joinMutation.mutate({
            roomId: roomId,
            name: players[currentPlayer].name!,
            currentPlayer: currentPlayer,
          });
        }

        // on player 2 reciving join eventreciving join 
        if (!data.playerNumber && typeof roomId == "string") {

          setPlayerNames(0, data.name);
        }

        // if (data.playerNumber != currentPlayer) {
        //   if (data.playerNumber == 0) console.log(data.name)
        //   setPlayerNames(data.playerNumber, data.name);

        //   if (
        //     typeof roomId == "string" &&
        //     currentPlayer == 0 &&
        //     players[currentPlayer].name
        //   ) {
        //     joinMutation.mutate({
        //       roomId: roomId,
        //       name: players[currentPlayer].name!,
        //       currentPlayer: currentPlayer,
        //     });
        //   }
        // }
      });
      pusherMemo.channel.bind(Events.USER_PLAY, (data: any) => {
        setPlayerPlay(data.playerNumber, data.play);
      });
    }
  }, [roomId]);

  const playerWin = (player: 0 | 1) => {
    alert(`${players[player].name} WINS!`);
  };
  const playerDraw = () => {
    alert("DRAW!!!");
  };

  useEffect(() => {
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

      clearPlayersPlays();
    }
  }, [players[0].play, players[1].play]);

  // TODO: playing against text and disappearing buttons but make selected button enabled

  const joinHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPlayer(1);
    if (players[currentPlayer].name && typeof roomId == "string")
      joinMutation.mutate({
        roomId: roomId,
        name: players[currentPlayer].name!,
        currentPlayer: currentPlayer,
      });
  };

  const { mutate: sendPlay } = trpc.gameRouter.play.useMutation();
  const pickPlay = (play: "rock" | "paper" | "scissors") => {
    if (
      players[currentPlayer] &&
      players[currentPlayer].name &&
      typeof roomId == "string"
    )
      sendPlay({
        name: players[currentPlayer].name!,
        roomId,
        currentPlayer,
        play,
      });
  };

  return (
    <>
      <Head>
        <title>{`rps-${roomId}`}</title>
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
        {players[0].name ? (
          <>
            {players[0].name}
            <br />
            {players[1].name ?? "Waiting for player..."}
            <span>{roomId}</span>
          </>
        ) : (
          <form className="flex flex-col gap-8" onSubmit={joinHandler}>
            <span>Joining room {roomId}</span>
            <input
              value={players[1].name}
              id="name"
              name="name"
              required
              maxLength={32}
              onChange={(e) => setPlayerNames(1, e.currentTarget.value)}
              className="input-bordered input w-full max-w-xs"
            />
            <button
              type="submit"
              className="btn"
              disabled={joinMutation.isLoading}
            >
              JOIN!
            </button>
          </form>
        )}
        {players[0].name && players[1].name && (
          <div className="flex gap-3">
            <button
              className="btn-accent btn"
              onClick={() => pickPlay("rock")}
              disabled={!!players[currentPlayer].play}
            >
              ROCK
            </button>
            <button
              className="btn-secondary btn"
              onClick={() => pickPlay("paper")}
              disabled={!!players[currentPlayer].play}
            >
              PAPER
            </button>
            <button
              className="btn-primary btn"
              onClick={() => pickPlay("scissors")}
              disabled={!!players[currentPlayer].play}
            >
              SCISSORS
            </button>
          </div>
        )}
      </main>
    </>
  );
};

export default Room;
