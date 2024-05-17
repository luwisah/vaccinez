import type { AppProps } from "next/app";
import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";
import "../styles/globals.css";
import Head from "next/head";
import ThirdwebGuideFooter from "../components/GitHubLink";
import { Sepolia } from "@thirdweb-dev/chains"

// This is the chain your dApp will work on.
const activeChain = "base-sepolia-testnet";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider activeChain={activeChain} clientId="ca6c01652261abfdd617031cacb72659">
      <Head>
        <title>Vaccinez Claim</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Claim your vaccinez"
        />
        <meta
          name="keywords"
          content="Dr Brainz Laboratory"
        />
      </Head>
      <Component {...pageProps} />
      <ThirdwebGuideFooter />
    </ThirdwebProvider>
  );
}

export default MyApp;
