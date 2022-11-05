import type { NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import { useUserStore } from "../utils/userStore";
import { useEffect } from "react";
import Pusher from "pusher-js";
import { env } from "../env/client.mjs";

const Home: NextPage = () => {
  const router = useRouter();
  const { players, setPlayer, myName, setMyName, setIsPlaying, clearAll } =
    useUserStore();

  // Clear all past game data
  useEffect(() => {
    if (localStorage.getItem("lastRoomId")) {
      const pusher = new Pusher(env.NEXT_PUBLIC_APP_KEY, { cluster: "eu" });
      pusher.unbind_all();
      pusher.unsubscribe(localStorage.getItem("lastRoomId")!);
    }
    localStorage.removeItem("lastRoomId");
    clearAll();
  }, []);

  // On lobby creation
  const createMutation = trpc.gameRouter.create.useMutation({
    onSuccess: (data) => {
      if (data.userId)
        localStorage.setItem("userId", data.userId);
      setIsPlaying(1);

      router.push(`/${data.gameId}`);
    },
  });

  // On form submit
  const signupHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = localStorage.getItem("userId") || undefined;
    createMutation.mutate({ name: myName, userId: payload });
  };

  return (
    <>
      <Head>
        <title>psycho-rps</title>
        <meta name="description" content="Test game to learn websockets!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-24 p-4">
        <h1 className="text-3xl font-extrabold text-black">
          WELCOME TO PSYCHO-RPS
        </h1>
        <form className="flex flex-col gap-8" onSubmit={signupHandler}>
          <input
            value={players[0].name}
            id="name"
            name="name"
            required
            maxLength={32}
            onChange={(e) => setMyName(e.currentTarget.value)}
            className="input-bordered input w-full max-w-xs"
          />
          <button
            type="submit"
            className="btn"
            disabled={createMutation.isLoading}
          >
            PLAY!
          </button>
        </form>
      </main>
    </>
  );
};

export default Home;
