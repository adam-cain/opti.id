"use client";
import { useState, useCallback } from "react";
import CoinAnimation from "~/components/CoinAnimation";
import confetti from "canvas-confetti";
import { Button } from "./ui/Button";
import { useSendTransaction } from "wagmi";

const DEFAULT_LOGOS = [
  '/images/base.png',
  '/images/optimism.png',
  '/images/ink.png',
  '/images/the_graph.png',
  '/images/missing.png',
];

export default function Frame() {
  const [claiming, setClaiming] = useState(false);
  const [blurred, setBlurred] = useState(true);

  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const sendTx = useCallback(async () => {
    return new Promise((resolve, reject) => {
      sendTransaction(
        {
          // Change to the opti.id contract address
          // Yoink address: 0x4bBFD120d9f352A0BEd7a014bd67913a2007a878
          to: "0x4bBFD120d9f352A0BEd7a014bd67913a2007a878",
          data: "0x9846cd9efc000023c0",
        },
        {
          onSuccess: (hash) => {
            handleClaim();
            console.log(hash);
            resolve(hash);
          },
          onError: (error) => {
            console.error(error);
            reject(error);
            setClaiming(false);
          },
        }
      );
    });
  }, [sendTransaction]);

  const handleClaim = useCallback(() => {
    try {
      // Remove blur immediately when clicked
      setBlurred(false);      
      // Set claimed to true after transaction is signed
      setClaiming(true);
    } catch (error) {
      console.error("Transaction failed:", error);
      // Revert UI state if transaction fails
      setBlurred(true);
    }
  }, [sendTx]);

  const triggerFireworks = useCallback(() => {
    if (typeof window === "undefined") return;
    
    const duration = 3000; // 3 seconds
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Create confetti from multiple angles
      confetti({
        particleCount,
        spread: 70,
        origin: { y: 0.6 }
      });

      confetti({
        particleCount,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 }
      });

      confetti({
        particleCount,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 }
      });
    }, 250);
  }, []);

  const handleClaimComplete = useCallback(() => {
    // This is called when the coin animation completes
    triggerFireworks();
  }, [triggerFireworks]);

  return (
    <div className="h-[100dvh] w-full bg-white grid grid-rows-[auto_1fr_auto] px-3 sm:px-4 md:px-6 py-6 text-stone-900">
      <header className="border-[0.5px] border-b-0 border-stone-200 px-4 py-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-light text-left">opti.id</h1>
      </header>

      <main className="relative flex items-center justify-center overflow-hidden w-full max-h-full mx-auto border-[0.5px] border-stone-200">
        <div 
          className="size-full absolute top-0 left-0" 
          style={{
            background: "radial-gradient(circle, #ffffe6, transparent 80%)"
          }}
        />
        <div 
          className={`size-full mx-auto ${blurred ? "blur-md" : ""} transition-all duration-500`}
          style={{ 
            transform: `scale(${claiming ? 1.1 : 1})`, 
            transition: "transform 0.5s ease-in-out" 
          }}
        >
          <CoinAnimation 
            isClaimed={claiming} 
            onClaimComplete={handleClaimComplete} 
            logos={DEFAULT_LOGOS}
          />
        </div>
      </main>

      <footer className="flex justify-center border-[0.5px] border-t-0 border-stone-200">
        <Button onClick={sendTx} disabled={isSendTxPending || claiming} isLoading={isSendTxPending || claiming}>
          {isSendTxPending || claiming ? "Claiming..." : "Claim"}
        </Button>
        {sendTxError && <p className="text-red-500">{sendTxError?.message}</p>}
      </footer>
    </div>
  );
}


