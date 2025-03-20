import { createConfig, http, WagmiProvider } from "wagmi";
import {
  optimism,
  base,
  worldchain,
  mode,
  zora,
  ink,
  unichain,
  soneium,
  swellchain,
  metalL2,
  lisk,
  polynomial,
  mint,
  superseed,
  shape,
  ethernity,
  bob,
  mainnet,
  degen,
} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

export const config = createConfig({
  chains: [optimism, mainnet, degen, unichain, worldchain, mode, zora, ink, soneium, swellchain, metalL2, lisk, polynomial, mint, superseed, shape, ethernity, bob],
  transports: {
    // [base.id]: http(),
    [optimism.id]: http(),
    [mainnet.id]: http(),
    [degen.id]: http(),
    [unichain.id]: http(),
    [worldchain.id]: http(),
    [mode.id]: http(),
    [zora.id]: http(),
    [ink.id]: http(),
    [soneium.id]: http(),
    [swellchain.id]: http(),
    [metalL2.id]: http(),
    [lisk.id]: http(),
    [polynomial.id]: http(),
    [mint.id]: http(),
    [superseed.id]: http(),
    [shape.id]: http(),
    [ethernity.id]: http(),
    [bob.id]: http(),
  },
  connectors: [farcasterFrame()],
});

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
