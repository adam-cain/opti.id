import { NextRequest, NextResponse } from 'next/server';
import { getConstants } from '../lib/contract';
// import { CHAINS } from '../const/chains';
import { ethers } from 'ethers';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';
import { ADJECTIVES, DESCRIPTORS, NOUNS, CHAINS } from '@opti.id/constants';

const CHAIN_ADDRESS_MAP: Record<CHAINS , string> = {
  optimism: process.env.OPTIMISM_DOMAIN_ADDRESS as string,
  base: process.env.BASE_DOMAIN_ADDRESS as string,
  ink: process.env.INK_DOMAIN_ADDRESS as string,
  the_graph: process.env.THE_GRAPH_DOMAIN_ADDRESS as string,
}

// ManagedRegistry ABI snippet for the functions we need
const MANAGED_REGISTRY_ABI = [
  'function register(address domain, string calldata label, address owner, uint256 deadline, bytes32 nonce, bytes calldata signature) external',
  'function verifySignatureRandom(address domain, address owner, uint256 deadline, bytes32 nonce, bytes calldata signature) public view returns (bool)',
  'function userRegistrationCount(address) external view returns (uint256)'
];

// Domain ABI snippet for the functions we need
const DOMAIN_ABI = [
  'function subdomains(string memory name) external view returns (address)',
  'function owner() external view returns (address)'
];

// Get chain domains from environment variables or configuration
const CHAIN_DOMAINS: Record<string, string> = {
  optimism: process.env.OPTIMISM_DOMAIN_ADDRESS as string,
  base: process.env.BASE_DOMAIN_ADDRESS as string,
  ink: process.env.INK_DOMAIN_ADDRESS as string,
  the_graph: process.env.THE_GRAPH_DOMAIN_ADDRESS as string,
  // Add other chains as needed
};

const REGISTRY_ADDRESS = process.env.MANAGED_REGISTRY_ADDRESS as string;
const REGISTRY_PRIVATE_KEY = process.env.REGISTRY_PRIVATE_KEY as string;

// Helper function to get random item from array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate a random label in the format "adjective-descriptor-noun"
function generateRandomLabel(): string {
  const adjective = getRandomItem(ADJECTIVES);
  const descriptor = getRandomItem(DESCRIPTORS);
  const noun = getRandomItem(NOUNS);
  return `${adjective}-${descriptor}-${noun}`;
}

// Check if a label is available on a given domain
async function isLabelAvailable(domainAddress: string, label: string, provider: ethers.providers.JsonRpcProvider): Promise<boolean> {
  try {
    const domainContract = new ethers.Contract(domainAddress, DOMAIN_ABI, provider);
    const subdomainAddress = await domainContract.subdomains(label);
    
    // If the returned address is the zero address, the label is available
    return subdomainAddress === ethers.constants.AddressZero;
  } catch (error) {
    console.error('Error checking label availability:', error);
    return false;
  }
}

// Generate a random available label for a given domain
async function generateAvailableLabel(domainAddress: string, provider: ethers.providers.JsonRpcProvider): Promise<string> {
  let label = generateRandomLabel();
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!(await isLabelAvailable(domainAddress, label, provider)) && attempts < maxAttempts) {
    label = generateRandomLabel();
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Could not find an available label after multiple attempts');
  }
  
  return label;
}

// Generate a random nonce
function generateNonce(): string {
  return ethers.utils.hexlify(ethers.utils.randomBytes(32));
}

// Sign the registration message using the server's private key
async function signRegistrationMessage(
  domainAddress: string,
  owner: string,
  deadline: number,
  nonce: string
): Promise<string> {
  const wallet = new ethers.Wallet(REGISTRY_PRIVATE_KEY);
  
  // Create the domain parameters for EIP-712 signing
  const domain = {
    name: 'OptiPermissionedRegistry',
    version: '1.0.0',
    chainId: 10, // Use Optimism chain ID
    verifyingContract: REGISTRY_ADDRESS
  };
  
  // Type definition for EIP-712
  const types = {
    'Register Random': [
      { name: 'owner', type: 'address' },
      { name: 'deadline', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' }
    ]
  };
  
  // The message data
  const value = {
    owner,
    deadline,
    nonce
  };
  
  // Sign the typed data (ethers v5)
  return await wallet._signTypedData(domain, types, value);
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { owner } = body;
    
    if (!owner || !ethers.utils.isAddress(owner)) {
      return NextResponse.json({ error: 'Invalid owner address' }, { status: 400 });
    }
    
    // Set up provider
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    
    // Select a random chain
    const chainKeys = Object.keys(CHAIN_DOMAINS);
    const randomChain = getRandomItem(chainKeys);
    const domainAddress = CHAIN_DOMAINS[randomChain];
    
    if (!domainAddress) {
      return NextResponse.json({ error: 'Domain address not configured for selected chain' }, { status: 500 });
    }
    
    // Generate a random available label
    const label = await generateAvailableLabel(domainAddress, provider);
    
    // Set deadline (e.g., 1 hour from now)
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    
    // Generate nonce
    const nonce = generateNonce();
    
    // Sign the registration message
    const signature = await signRegistrationMessage(domainAddress, owner, deadline, nonce);
    
    // Return the registration data to the client
    return NextResponse.json({
      success: true,
      data: {
        domain: domainAddress,
        chain: randomChain,
        label,
        owner,
        deadline,
        nonce,
        signature,
        registryAddress: REGISTRY_ADDRESS
      }
    });
  } catch (error) {
    console.error('Error in registration API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET route to get current registration info
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner');
  
  if (!owner || !ethers.utils.isAddress(owner)) {
    return NextResponse.json({ error: 'Invalid owner address' }, { status: 400 });
  }
  
  try {
    // Set up provider and contract
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const registryContract = new ethers.Contract(REGISTRY_ADDRESS, MANAGED_REGISTRY_ABI, provider);
    
    // Get the user's registration count
    const registrationCount = await registryContract.userRegistrationCount(owner);
    
    return NextResponse.json({
      success: true,
      data: {
        owner,
        registrationCount: registrationCount.toNumber(),
        maxAllowed: getConstants().MAX_DOMAINS_PER_USER
      }
    });
  } catch (error) {
    console.error('Error getting registration info:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
