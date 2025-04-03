import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';

// Type for registration data returned from API
interface RegistrationData {
  domain: string;
  chain: string;
  label: string;
  owner: string;
  deadline: number;
  nonce: string;
  signature: string;
  registryAddress: string;
}

// Type for registration status
interface RegistrationInfo {
  owner: string;
  registrationCount: number;
  maxAllowed: number;
}

export default function DomainRegistration() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [registrationInfo, setRegistrationInfo] = useState<RegistrationInfo | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // ABI for ManagedRegistry contract
  const REGISTRY_ABI = [
    'function register(address domain, string calldata label, address owner, uint256 deadline, bytes32 nonce, bytes calldata signature) external'
  ];

  // Fetch registration status when user connects
  useEffect(() => {
    if (isConnected && address) {
      fetchRegistrationInfo();
    }
  }, [isConnected, address]);

  // Fetch registration info from API
  const fetchRegistrationInfo = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const response = await fetch(`/api?owner=${address}`);
      if (!response.ok) {
        throw new Error('Failed to get registration info');
      }
      
      const data = await response.json();
      if (data.success) {
        setRegistrationInfo(data.data);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get registration info');
    } finally {
      setLoading(false);
    }
  };

  // Request random domain registration from API
  const requestRandomDomain = async () => {
    if (!address) return;

    try {
      setRegistrationStatus('loading');
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner: address }),
      });

      if (!response.ok) {
        throw new Error('Failed to get random domain');
      }
      
      const data = await response.json();
      if (data.success) {
        setRegistrationData(data.data);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get random domain');
      setRegistrationStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Contract write hook for registration (wagmi v2)
  const { 
    writeContract,
    isPending,
    isSuccess,
    isError 
  } = useWriteContract();

  // Register domain when registration data is available
  const registerDomain = () => {
    if (registrationData) {
      writeContract({
        address: registrationData.registryAddress as `0x${string}`,
        abi: REGISTRY_ABI,
        functionName: 'register',
        args: [
          registrationData.domain,
          registrationData.label,
          registrationData.owner,
          BigInt(registrationData.deadline),
          registrationData.nonce,
          registrationData.signature
        ],
      });
    }
  };

  // Update registration status based on contract write status
  useEffect(() => {
    if (isSuccess) {
      setRegistrationStatus('success');
      // Refresh registration info after successful registration
      fetchRegistrationInfo();
    } else if (isError) {
      setRegistrationStatus('error');
    }
  }, [isSuccess, isError]);

  // Check if user has reached registration limit
  const isRegistrationLimitReached = 
    registrationInfo && registrationInfo.registrationCount >= registrationInfo.maxAllowed;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Get Your Opti.id Domain</h2>
      
      {loading && <p className="text-gray-500">Loading...</p>}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      {registrationInfo && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded">
          <p>Registered domains: {registrationInfo.registrationCount} / {registrationInfo.maxAllowed}</p>
        </div>
      )}
      
      {isRegistrationLimitReached ? (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded">
          You have reached the maximum number of allowed domains.
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={requestRandomDomain}
            disabled={loading || registrationStatus === 'loading' || !isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Get Random Domain
          </button>
          
          {registrationData && (
            <div className="mt-4 p-4 border border-gray-300 rounded">
              <h3 className="text-xl font-semibold mb-2">Your Domain</h3>
              <p className="mb-1"><span className="font-medium">Chain:</span> {registrationData.chain}</p>
              <p className="mb-1"><span className="font-medium">Label:</span> {registrationData.label}</p>
              <p className="mb-4"><span className="font-medium">Full Domain:</span> {registrationData.label}.{registrationData.chain}.opti.id</p>
              
              <button
                onClick={registerDomain}
                disabled={isPending || !registrationData}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isPending ? 'Registering...' : 'Register Domain'}
              </button>
            </div>
          )}
          
          {registrationStatus === 'success' && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
              Domain registration successful!
            </div>
          )}
        </div>
      )}
    </div>
  );
} 