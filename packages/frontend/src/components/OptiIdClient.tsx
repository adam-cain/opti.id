'use client';

import { useState } from 'react';
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { optiIdContractConfig, getConstants } from '../lib/contract';
import { formatEther } from 'viem';

// Safely access window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Example component that interacts with the OptiId contract
export default function OptiIdClient() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const [selectedChainIndex, setSelectedChainIndex] = useState(0);
  const [registeredDomain, setRegisteredDomain] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Get contract write functions from wagmi
  const { writeContractAsync, isPending, reset, data: hash } = useWriteContract();
  const { status } = useWaitForTransactionReceipt({ hash });
  
  const constants = getConstants();
  const { CHAINS } = constants;
  
  // Register a domain using wagmi hooks
  const registerDomain = async () => {
    if (!address) {
      setErrorMsg('Wallet not connected');
      return;
    }
    
    try {
      setErrorMsg(null);
      reset();
      
      // Call the contract method using wagmi's writeContractAsync
      await writeContractAsync({
        ...optiIdContractConfig,
        functionName: 'registerRandomDomain',
        args: [selectedChainIndex],
        value: constants.REGISTRATION_FEE,
      });
      
      // The status and success will be tracked by the useWaitForTransactionReceipt hook
      // We would need to fetch the domains in a useEffect that runs when status === 'success'
    } catch (error) {
      console.error('Error registering domain:', error);
      setErrorMsg(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // When the transaction succeeds, fetch the new domain
  // In a real app, you'd use a useEffect with the useUserDomains hook
  
  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-4">OptiID Domain Registration</h1>
      
      {!isConnected ? (
        <div className="mb-4">
          <p className="text-red-500 mb-2">Please connect your wallet to continue</p>
          <button 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => connect({ connector: injected() })}
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Connected Address</p>
            <p className="font-mono bg-gray-100 p-2 rounded">{address}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Registration Fee</p>
            <p className="font-semibold">{formatEther(constants.REGISTRATION_FEE)} ETH</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-500 mb-1">Select Chain</label>
            <select 
              className="w-full p-2 border rounded"
              value={selectedChainIndex}
              onChange={(e) => setSelectedChainIndex(Number(e.target.value))}
            >
              {CHAINS.map((chain: string, index: number) => (
                <option key={chain} value={index}>
                  {chain}
                </option>
              ))}
            </select>
          </div>
          
          <button
            className={`w-full ${
              isPending 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-700'
            } text-white font-bold py-2 px-4 rounded mb-4`}
            onClick={registerDomain}
            disabled={isPending}
          >
            {isPending ? 'Registering...' : 'Register Random Domain'}
          </button>
          
          {errorMsg && (
            <div className="text-red-500 mb-4">
              {errorMsg}
            </div>
          )}
          
          {status === 'success' && hash && (
            <div className="bg-green-100 p-4 rounded mb-4">
              <p className="text-sm text-gray-500 mb-1">Transaction Successful!</p>
              <p className="font-mono text-xs break-all">{hash}</p>
              <p className="mt-2">Check your domains list to see your new domain.</p>
            </div>
          )}
        </>
      )}
      
      <p className="text-xs text-gray-400 mt-4">
        Note: This is a simplified example. For a complete implementation,
        use the custom hooks in useOptiIdContract.ts.
      </p>
    </div>
  );
} 