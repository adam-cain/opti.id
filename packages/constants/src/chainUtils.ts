import { CHAINS, CHAIN_KEYS, CHAIN_KEY } from './chains';

/**
 * Utility function to create a typed record of chain addresses
 * @param initialValues Initial values for the chain address map
 * @returns A record mapping chain keys to addresses
 */
export function createChainAddressMap(initialValues: Partial<Record<CHAIN_KEY, string>> = {}): Record<CHAIN_KEY, string> {
  const map: Partial<Record<CHAIN_KEY, string>> = { ...initialValues };
  
  // Create a properly typed record with all chains
  const result = CHAIN_KEYS.reduce((acc, chainKey) => {
    acc[chainKey] = map[chainKey] || '';
    return acc;
  }, {} as Record<CHAIN_KEY, string>);
  
  return result;
}

/**
 * Utility to get a formatted mapping from chain names to keys
 * @returns A record mapping chain names to their lowercase key versions
 */
export function getChainKeyMap(): Record<string, CHAIN_KEY> {
  const result: Record<string, CHAIN_KEY> = {};
  
  for (let i = 0; i < CHAINS.length; i++) {
    result[CHAINS[i]] = CHAIN_KEYS[i];
  }
  
  return result;
} 