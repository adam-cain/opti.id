import { useEffect, useState } from 'react';
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { optiIdContractConfig, DomainInfo, DomainComponents } from '../lib/contract';

// Hooks for reading from the contract
export const useUserDomains = (userAddress?: string) => {
  const { data, isLoading, error, refetch } = useReadContract({
    ...optiIdContractConfig,
    functionName: 'getUserDomains',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
  });

  return { 
    domains: data as string[] || [], 
    isLoading, 
    error, 
    refetch 
  };
};

export const useDomainInfo = (domainName?: string) => {
  const { data, isLoading, error } = useReadContract({
    ...optiIdContractConfig,
    functionName: 'getDomainInfo',
    args: domainName ? [domainName] : undefined,
  });

  const result = data as [string, bigint, boolean] | undefined;
  
  const domainInfo: DomainInfo | undefined = result 
    ? { 
        owner: result[0] as `0x${string}`, 
        timestamp: result[1], 
        exists: result[2] 
      } 
    : undefined;

  return { domainInfo, isLoading, error };
};

export const useDomainComponents = (domainName?: string) => {
  const { data, isLoading, error } = useReadContract({
    ...optiIdContractConfig,
    functionName: 'getDomainComponents',
    args: domainName ? [domainName] : undefined,
  });

  const result = data as [string, string, string, string] | undefined;
  
  const components: DomainComponents | undefined = result 
    ? { 
        adjective: result[0], 
        descriptor: result[1], 
        noun: result[2], 
        chain: result[3] 
      } 
    : undefined;

  return { components, isLoading, error };
};

export const usePreviewRandomDomain = (userAddress?: string, nonce = 1, chainIndex = 0) => {
  const { data, isLoading, error } = useReadContract({
    ...optiIdContractConfig,
    functionName: 'previewRandomDomain',
    args: userAddress ? [userAddress as `0x${string}`, BigInt(nonce), chainIndex] : undefined,
  });

  return { 
    domainPreview: data as string | undefined, 
    isLoading, 
    error 
  };
};

export const useAllComponents = () => {
  const { data, isLoading, error } = useReadContract({
    ...optiIdContractConfig,
    functionName: 'getAllComponents'
  });

  const result = data as [string[], string[], string[], string[]] | undefined;

  return { 
    components: result, 
    adjectives: result?.[0] || [], 
    descriptors: result?.[1] || [],
    nouns: result?.[2] || [],
    chains: result?.[3] || [],
    isLoading, 
    error 
  };
};

// Hooks for writing to the contract
export const useRegisterRandomDomain = () => {
  const { writeContractAsync, isPending, error, data: hash } = useWriteContract();
  const { address } = useAccount();
  const { status } = useWaitForTransactionReceipt({ hash });
  
  const registerDomain = async (chainIndex: number) => {
    if (!address) throw new Error("Wallet not connected");
    
    return writeContractAsync({
      ...optiIdContractConfig,
      functionName: 'registerRandomDomain',
      args: [chainIndex],
      value: BigInt(10000000000000n), // 0.0001 ETH
    });
  };

  return { 
    registerDomain, 
    isPending, 
    error, 
    hash,
    status,
    isSuccess: status === 'success'
  };
};

export const useTransferDomain = () => {
  const { writeContractAsync, isPending, error, data: hash } = useWriteContract();
  const { address } = useAccount();
  const { status } = useWaitForTransactionReceipt({ hash });
  
  const transferDomain = async (domainName: string, toAddress: `0x${string}`) => {
    if (!address) throw new Error("Wallet not connected");
    
    return writeContractAsync({
      ...optiIdContractConfig,
      functionName: 'transferDomain',
      args: [domainName, toAddress],
    });
  };

  return { 
    transferDomain, 
    isPending, 
    error, 
    hash,
    status,
    isSuccess: status === 'success'
  };
}; 