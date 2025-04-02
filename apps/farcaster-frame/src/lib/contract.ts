import { parseEther, formatEther } from 'viem';
import { OptiIdRegistry__factory } from '../../../contracts/typechain-types';
import { wordList, chains } from '../../../contracts/constants/domainData';

// Contract constants
export const OPTIMISM_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890' as `0x${string}`;
export const REGISTRATION_FEE = parseEther('0.0001');
export const MAX_DOMAINS_PER_USER = 5;

// Use the ABI from TypeChain
export const optiIdAbi = OptiIdRegistry__factory.abi;

// Domain Types
export type DomainInfo = {
  owner: `0x${string}`;
  timestamp: bigint;
  exists: boolean;
};

export type DomainComponents = {
  adjective: string;
  descriptor: string;
  noun: string;
  chain: string;
};

// Constants accessor
export const getConstants = () => {
  return {
    CONTRACT_ADDRESS: OPTIMISM_CONTRACT_ADDRESS,
    REGISTRATION_FEE,
    MAX_DOMAINS_PER_USER,
    REGISTRATION_FEE_ETH: formatEther(REGISTRATION_FEE),
    WORD_LIST: wordList,
    CHAINS: chains
  };
};

// Export contract config for use with wagmi hooks
export const optiIdContractConfig = {
  address: OPTIMISM_CONTRACT_ADDRESS,
  abi: optiIdAbi,
}; 