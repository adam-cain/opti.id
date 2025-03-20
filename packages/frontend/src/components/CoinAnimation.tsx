"use client"
import { useState, Suspense, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Coin } from './Coin';

type AnimationPhase = 'idle' | 'accelerate' | 'rise' | 'fall' | 'impact' | 'reveal';

interface CoinAnimationProps {
  logos?: string[];
  animationSpeed?: number;
  onClaimComplete?: () => void;
  isClaimed?: boolean;
}

// Loading fallback component
const LoadingFallback = () => (
  <mesh>
    <sphereGeometry args={[1, 16, 16]} />
    <meshStandardMaterial color="#FFD700" wireframe />
  </mesh>
);

export default function CoinAnimation({ 
  logos = [
    '/images/base.png',
    '/images/optimism.png',
    '/images/ink.png',
    '/images/the_graph.png',
    '/images/missing.png',
  ],
  animationSpeed = 2,
  onClaimComplete,
  isClaimed = false
}: CoinAnimationProps) {
  const [logoIndex, setLogoIndex] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [showFlash, setShowFlash] = useState(false);
  const [showNameplate, setShowNameplate] = useState(false);

  // Handle claim initiated from outside
  useEffect(() => {
    if (isClaimed && animationPhase === 'idle') {
      startClaimAnimation();
    }
  }, [isClaimed, animationPhase]);

  // Manage animation sequence
  const startClaimAnimation = useCallback(() => {
    // Start with acceleration
    setAnimationPhase('accelerate');
    
    // After a short delay, start rising
    setTimeout(() => {
      setAnimationPhase('rise');
    }, 500);
  }, []);

  // Handle phase transitions
  const handleAnimationComplete = useCallback(() => {
    if (animationPhase === 'rise') {
      // After rising completes, start falling
      setAnimationPhase('fall');
    } 
    else if (animationPhase === 'fall') {
      // After falling completes, show impact effects
      setAnimationPhase('impact');
      
      // Show flash effect
      setShowFlash(true);
      
      setTimeout(() => {
        setShowFlash(false);
        setAnimationPhase('reveal');
        
        // Show nameplate after a delay
        setTimeout(() => {
          setShowNameplate(true);
          
          // Notify parent that animation is complete
          onClaimComplete?.();
        }, 1000);
      }, 1000);
    }
  }, [animationPhase, onClaimComplete]);

  // Handle the full rotation event
  const handleFullRotation = useCallback(() => {
    setLogoIndex(prevIndex => (prevIndex + 1) % logos.length);
  }, [logos.length]);

  return (
    <div className="size-full max-h-screen relative">
      {/* Flash overlay */}
      {showFlash && (
        <div className="absolute inset-0 z-10 animate-flash opacity-0"></div>
      )}
      
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <ambientLight intensity={6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <spotLight
          position={[0, 0, 10]}
          angle={0.3}
          penumbra={1}
          intensity={2}
          color="#FFFF00"
          castShadow
        />

        <Suspense fallback={<LoadingFallback />}>
          <Coin 
            logos={logos}
            logoIndex={logoIndex} 
            onFullRotation={handleFullRotation}
            animationSpeed={
              animationPhase === 'idle' 
                ? animationSpeed 
                : animationPhase === 'accelerate' 
                  ? 16
                  : 22
            }
            animationPhase={animationPhase}
            onAnimationComplete={handleAnimationComplete}
          />
        </Suspense>
      </Canvas>
      
      {/* Nameplate */}
      {showNameplate && (
        <div className="absolute bottom-14 left-0 right-0 mx-auto w-full max-w-xs bg-white p-3 shadow-lg text-center transform animate-slide-up">
          <p className="text-lg font-bold text-gray-900">Your ID</p>
          <p className="text-blue-600 font-mono">super.unique.unicorn.op</p>
        </div>
      )}
    </div>
  );
} 