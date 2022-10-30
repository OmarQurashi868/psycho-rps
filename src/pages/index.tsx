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
  const { players, setPlayerNames, setCurrentPlayer, clearAll } =
    useUserStore();

  useEffect(() => {
    // TODO: CLEAR ON INDEX
    if (localStorage.getItem("lastRoomId")) {
      const pusher = new Pusher(env.NEXT_PUBLIC_APP_KEY, { cluster: "eu" });
      pusher.unbind_all();
      pusher.unsubscribe(localStorage.getItem("lastRoomId")!);
    }
    localStorage.removeItem("lastRoomId");  
    clearAll();
    setPlayerNames(0, "");
  }, []);

  const signupMutation = trpc.gameRouter.signup.useMutation({
    onSuccess: (data) => {
      setCurrentPlayer(0);
      router.push(`/${data.roomId}`);
    },
  });

  const signupHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (players[0].name) signupMutation.mutate({ name: players[0].name });
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
            onChange={(e) => setPlayerNames(0, e.currentTarget.value)}
            className="input-bordered input w-full max-w-xs"
          />
          <button
            type="submit"
            className="btn"
            disabled={signupMutation.isLoading}
          >
            PLAY!
          </button>
        </form>
      </main>
    </>
  );
};

export default Home;
