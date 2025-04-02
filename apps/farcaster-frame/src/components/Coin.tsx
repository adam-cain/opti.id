"use client"
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { useSingleLogoTexture } from '../hooks/useSingleLogoTexture';

type AnimationPhase = 'idle' | 'accelerate' | 'rise' | 'fall' | 'impact' | 'reveal';

interface CoinProps {
    logoIndex: number;
    onFullRotation: () => void;
    logos: string[];
    animationSpeed?: number;
    animationPhase?: AnimationPhase;
    onAnimationComplete?: () => void;
}

// Loading placeholder shown while textures are loading
function LoadingPlaceholder() {
    return (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2, 2, 0.2, 32]} />
            <meshStandardMaterial color="#CCCCCC" wireframe={true} attach="material-0" />
            <meshStandardMaterial color="#DDDDDD" wireframe={true} attach="material-1" />
            <meshStandardMaterial color="#EEEEEE" wireframe={true} attach="material-2" />
        </mesh>
    );
}

// The actual 3D coin object
export function Coin({
    logoIndex,
    onFullRotation,
    logos,
    animationSpeed = 1,
    animationPhase = 'idle',
    onAnimationComplete
}: CoinProps) {
    const meshRef = useRef<Mesh>(null);
    const rotationRef = useRef(0);
    const lastEdgeEventRef = useRef(0);
    const rotationSpeedRef = useRef(0.01);
    const positionYRef = useRef(0);
    const targetYRef = useRef(0);
    const targetRotationRef = useRef<number | null>(null);

    // Edge detection constants
    const EDGE_THRESHOLD_1 = Math.PI / 2;
    const EDGE_THRESHOLD_2 = 3 * Math.PI / 2;
    const SWAP_MARGIN = 0.25;

    // Handle texture loading and updating
    const { currentTexture, updateTexture, isLoading } = useSingleLogoTexture(logos, logoIndex);

    // Texture material properties - memoized to avoid recreating on each render
    const textureMaterial = useMemo(() => ({
        metalness: 0.5,
        roughness: 0.3,
        color: "#FFFFFF",
        emissive: "#333333",
        emissiveIntensity: 0.1,
    }), []);

    // Update rotation speed when animationSpeed changes
    useEffect(() => {
        rotationSpeedRef.current = 0.01 * animationSpeed;
    }, [animationSpeed]);

    // Handle animation phase changes
    useEffect(() => {
        switch(animationPhase) {
            case 'rise':
                targetYRef.current = 3; // Move up by 3 units
                break;
            case 'fall':
                targetYRef.current = -1.0; // Below starting point for bounce effect
                break;
            case 'impact':
            case 'reveal':
                targetYRef.current = 0; // Return to original position
                
                // Calculate target rotation to stop at (nearest 2π multiple)
                if (targetRotationRef.current === null) {
                    const fullRotations = Math.ceil(rotationRef.current / (2 * Math.PI));
                    targetRotationRef.current = fullRotations * 2 * Math.PI;
                }
                break;
        }
    }, [animationPhase]);

    // Animation frame handling
    useFrame((_, delta) => {
        if (!meshRef.current) return;

        // Handle vertical position animation
        if (['rise', 'fall', 'impact'].includes(animationPhase)) {
            const positionDiff = targetYRef.current - positionYRef.current;
            const speed = animationPhase === 'fall' ? 12 : 1.5; // Fall faster than rise
            positionYRef.current += positionDiff * delta * speed;
            meshRef.current.position.y = positionYRef.current;

            // Notify when position animation is nearly complete
            if (Math.abs(positionDiff) < 0.05 && onAnimationComplete) {
                onAnimationComplete();
            }
        }

        // Handle rotation based on animation phase
        if (animationPhase === 'impact' || animationPhase === 'reveal') {
            // Slow down and stop at target rotation
            if (targetRotationRef.current !== null) {
                const rotationDiff = targetRotationRef.current - rotationRef.current;

                if (Math.abs(rotationDiff) > 0.15) {
                    // Gradually slow down
                    rotationRef.current += rotationDiff * delta * 5.0;
                } else {
                    // Stop exactly at target
                    rotationRef.current = targetRotationRef.current;
                }
            }
        } else {
            // Normal rotation for other phases
            rotationRef.current += rotationSpeedRef.current;
        }
        
        // Apply rotation to the mesh (mod 2π to avoid large numbers)
        const normalizedRotation = rotationRef.current % (2 * Math.PI);
        meshRef.current.rotation.z = normalizedRotation;

        // Detect when edge is inline with the camera (at 90° or 270°)
        const isAtEdgeThreshold = 
            (normalizedRotation >= EDGE_THRESHOLD_1 && normalizedRotation < EDGE_THRESHOLD_1 + SWAP_MARGIN) ||
            (normalizedRotation >= EDGE_THRESHOLD_2 && normalizedRotation < EDGE_THRESHOLD_2 + SWAP_MARGIN);
            
        if (isAtEdgeThreshold) {
            // Only trigger if we're not too close to the last event and not in stop phases
            const isNotRecentlyTriggered = Math.abs(normalizedRotation - lastEdgeEventRef.current) > Math.PI / 4;
            const isActiveCoinPhase = animationPhase !== 'impact' && animationPhase !== 'reveal';
            
            if (isNotRecentlyTriggered && isActiveCoinPhase) {
                updateTexture();
                lastEdgeEventRef.current = normalizedRotation;
                onFullRotation();
            }
        }

        // Reset rotation counter once per full rotation to avoid floating point issues
        if (normalizedRotation >= 2 * Math.PI - 0.1 && normalizedRotation < 2 * Math.PI) {
            rotationRef.current = rotationRef.current % (2 * Math.PI);
        }
    });

    // Show loading placeholder if textures aren't ready yet
    if (isLoading || !currentTexture) {
        return <LoadingPlaceholder />;
    }

    return (
        <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2, 2, 0.2, 32]} />
            <meshStandardMaterial color="#F0F0F0" attach="material-0" />
            <meshStandardMaterial map={currentTexture} {...textureMaterial} attach="material-1" />
            <meshStandardMaterial map={currentTexture} {...textureMaterial} attach="material-2" />
        </mesh>
    );
} 