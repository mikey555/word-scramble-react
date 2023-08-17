import Head from "next/head";
import {
  setUseWhatChange,
} from '@simbathesailor/use-what-changed';
import { useUserIdContext } from "~/components/useUserIdContext";

import Lobby from "~/components/Lobby";


setUseWhatChange(process.env.NODE_ENV === 'development');


export default function Home() {
  

  
  const userId = useUserIdContext();
  if (userId != undefined) {
    // const authorized = api.example.authorize.useQuery({ userId: userId });
  }

  

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      
      <main className="flex justify-center h-screen">
          <div className="flex flex-col h-full w-full md:max-w-2xl mt-52">
            <Lobby />
          </div>
      </main>
      
    </>
  );
}
