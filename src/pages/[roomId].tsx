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
  const { name1, setName1, name2, setName2, isOwner, ...playStore } =
    useUserStore();

  const pusherMemo = useMemo(() => {
    if (typeof roomId == "string") {
      const pusher = new Pusher(env.NEXT_PUBLIC_APP_KEY, { cluster: "eu" });
      const channel = pusher.subscribe(roomId);
      return { pusher: pusher, channel: channel };
    }
  }, [roomId]);

  const joinMutation = trpc.gameRouter.join.useMutation();

  useEffect(() => {
    // Pusher.logToConsole = true;
    if (pusherMemo) {
      pusherMemo.channel.bind(Events.USER_JOIN, (data: any) => {
        if (!data.isOwner) {
          setName2(data.name);
          if (typeof roomId == "string" && name1)
            joinMutation.mutate({ roomId: roomId, name: name1, isOwner: true });
        } else {
          setName1(data.name);
        }
      });
      pusherMemo.channel.bind(Events.USER_PLAY, (data: any) => {
        playStore.setPlayerPlay(data.isOwner ? 1 : 2, data.play);
        console.log(data.play);
      });
    }
  }, [roomId]);

  useEffect(() => {
    if (playStore.player1play && playStore.player2play) {
      if (playStore.player1play == playStore.player2play) {
        alert("DRAW!!!");
      }
      if (playStore.player1play == "rock" && playStore.player2play == "scissors") {
        alert(`${name1} WINS!`)
      }
      if (playStore.player1play == "paper" && playStore.player2play == "rock") {
        alert(`${name1} WINS!`)
      }
      if (playStore.player1play == "scissors" && playStore.player2play == "paper") {
        alert(`${name1} WINS!`)
      }

      if (playStore.player2play == "rock" && playStore.player1play == "scissors") {
        alert(`${name2} WINS!`)
      }
      if (playStore.player2play == "paper" && playStore.player1play == "rock") {
        alert(`${name2} WINS!`)
      }
      if (playStore.player2play == "scissors" && playStore.player1play == "paper") {
        alert(`${name2} WINS!`)
      }
      
      playStore.setPlayerPlay(1, undefined);
      playStore.setPlayerPlay(2, undefined);
    }
  }, [playStore.player1play, playStore.player2play]);

  // TODO: playing against and disappearing buttons but make selection enabled

  const joinHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (name2 && typeof roomId == "string")
      joinMutation.mutate({ roomId: roomId, name: name2, isOwner: false });
  };

  const { mutate: sendPlay } = trpc.gameRouter.play.useMutation();
  const pickPlay = (play: "rock" | "paper" | "scissors") => {
    // playStore.setPlayerPlay(isOwner ? 1 : 2, play);
    if (name1 && name2 && typeof roomId == "string")
      sendPlay({
        name: isOwner ? name1 : name2,
        roomId,
        isOwner,
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
        {name1 ? (
          <>
            {name1}
            <br />
            {name2 ?? "Waiting for player..."}
            <span>{roomId}</span>
          </>
        ) : (
          <form className="flex flex-col gap-8" onSubmit={joinHandler}>
            <span>Joining room {roomId}</span>
            <input
              value={name1}
              id="name"
              name="name"
              required
              maxLength={32}
              onChange={(e) => setName2(e.currentTarget.value)}
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
        {name1 && name2 && (
          <div className="flex gap-3">
            <button
              className="btn-accent btn"
              onClick={() => pickPlay("rock")}
              disabled={
                isOwner ? !!playStore.player1play : !!playStore.player2play
              }
            >
              ROCK
            </button>
            <button
              className="btn-secondary btn"
              onClick={() => pickPlay("paper")}
              disabled={
                isOwner ? !!playStore.player1play : !!playStore.player2play
              }
            >
              PAPER
            </button>
            <button
              className="btn-primary btn"
              onClick={() => pickPlay("scissors")}
              disabled={
                isOwner ? !!playStore.player1play : !!playStore.player2play
              }
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
