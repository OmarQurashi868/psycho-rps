import type { NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import { useUserStore } from "../utils/userStore";

const Home: NextPage = () => {
  const router = useRouter();
  const { name1, setName1, setIsOwner } = useUserStore();

  // TODO: CLEAR ON INDEX

  const signupMutation = trpc.gameRouter.signup.useMutation({
    onSuccess: (data) => {
      setIsOwner(true);
      router.push(`/${data.roomId}`);
    },
  });

  const signupHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (name1) signupMutation.mutate({ name: name1 });
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
            value={name1}
            id="name"
            name="name"
            required
            maxLength={32}
            onChange={(e) => setName1(e.currentTarget.value)}
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
