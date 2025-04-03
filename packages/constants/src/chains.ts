export const CHAINS = [
  "Automata",
  "BOB",
  "Base",
  "Binary",
  "Cyber",
  "Ethernity",
  "Funki",
  "HashKey-Chain",
  "Ink",
  "Lisk",
  "Lyra-Chain",
  "Metal-L2",
  "Mint",
  "Mode",
  "OP",
  "Orderly",
  "Polynomial",
  "RACE",
  "Redstone",
  "Settlus",
  "Shape",
  "SnaxChain",
  "Soneium",
  "Superseed",
  "Swan-Chain",
  "Swellchain",
  "Unichain",
  "World-Chain",
  "Xterio-Chain",
  "Zora",
  "Arena-z"
];

// Create a type from the CHAINS array
export type CHAIN = typeof CHAINS[number];

// Create a lowercase version of CHAINS for use as keys in maps
export const CHAIN_KEYS = CHAINS.map(chain => chain.toLowerCase().replace(/-/g, '_'));

// Type for lowercase chain keys
export type CHAIN_KEY = typeof CHAIN_KEYS[number]; 