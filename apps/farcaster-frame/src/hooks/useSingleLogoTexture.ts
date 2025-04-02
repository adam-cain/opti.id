import { useState, useEffect, useRef, useCallback } from 'react';
import { TextureLoader, Texture, CanvasTexture } from 'three';

// Creates a placeholder texture when a logo fails to load
function createPlaceholderTexture(text: string, color: string = '#1A56DB'): CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not get canvas context');
    }

    // Fill background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new CanvasTexture(canvas);
    texture.center.set(0.5, 0.5);
    texture.rotation = -Math.PI / 2;
    
    return texture;
}

interface SingleLogoTextureResult {
    currentTexture: Texture | null;
    updateTexture: () => number;
    isLoading: boolean;
}

// Configure texture properties for display
function configureTexture(texture: Texture): Texture {
    texture.flipY = false;
    texture.center.set(0.5, 0.5);
    texture.rotation = -Math.PI / 2;
    texture.needsUpdate = true;
    return texture;
}

/**
 * Hook for managing logo textures with preloading
 */
export function useSingleLogoTexture(
    logos: string[],
    initialLogoIndex: number
): SingleLogoTextureResult {
    const [currentTexture, setCurrentTexture] = useState<Texture | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const logoIndexRef = useRef<number>(initialLogoIndex);
    
    // Cache for preloaded textures
    const textureCache = useRef<Map<number, Texture>>(new Map());
    
    // Load a texture for a specific logo index
    const loadTexture = useCallback((index: number): Promise<Texture> => {
        return new Promise((resolve) => {
            const logoPath = logos[index];
            
            if (!logoPath) {
                console.error(`Invalid logo path at index ${index}`);
                return resolve(createPlaceholderTexture('Missing Image'));
            }
            
            const textureLoader = new TextureLoader();
            textureLoader.load(
                logoPath,
                (texture) => {
                    const configuredTexture = configureTexture(texture);
                    resolve(configuredTexture);
                },
                undefined,
                () => {
                    const chainName = logoPath.split('/').pop()?.replace('.png', '') || 'Chain';
                    console.error(`Failed to load texture: ${logoPath}`);
                    resolve(createPlaceholderTexture(chainName));
                }
            );
        });
    }, [logos]);
    
    // Get or load a texture with caching
    const getTexture = useCallback(async (index: number): Promise<Texture> => {
        if (textureCache.current.has(index)) {
            return textureCache.current.get(index)!;
        }
        
        const texture = await loadTexture(index);
        textureCache.current.set(index, texture);
        return texture;
    }, [loadTexture]);
    
    // Preload the next texture
    const preloadNextTexture = useCallback(() => {
        const nextIndex = (logoIndexRef.current + 1) % logos.length;
        if (!textureCache.current.has(nextIndex)) {
            getTexture(nextIndex).catch(err => {
                console.error(`Error preloading texture ${nextIndex}:`, err);
            });
        }
    }, [getTexture, logos.length]);
    
    // Update to the next texture
    const updateTexture = useCallback(() => {
        const nextIndex = (logoIndexRef.current + 1) % logos.length;
        logoIndexRef.current = nextIndex;
        
        if (textureCache.current.has(nextIndex)) {
            setCurrentTexture(textureCache.current.get(nextIndex)!);
            preloadNextTexture();
        } else {
            setIsLoading(true);
            getTexture(nextIndex)
                .then(texture => {
                    setCurrentTexture(texture);
                    setIsLoading(false);
                    preloadNextTexture();
                })
                .catch(err => {
                    console.error("Error updating texture:", err);
                    setIsLoading(false);
                });
        }
        
        return nextIndex;
    }, [logos.length, getTexture, preloadNextTexture]);
    
    // Initial load of texture
    useEffect(() => {
        const initializeTexture = async () => {
            setIsLoading(true);
            try {
                const texture = await getTexture(initialLogoIndex);
                setCurrentTexture(texture);
                logoIndexRef.current = initialLogoIndex;
                preloadNextTexture();
            } catch (error) {
                console.error("Error initializing texture:", error);
                if (!currentTexture) {
                    setCurrentTexture(createPlaceholderTexture('Logo'));
                }
            } finally {
                setIsLoading(false);
            }
        };
        
        initializeTexture();
    }, [initialLogoIndex, getTexture, preloadNextTexture, currentTexture]);
    
    return { currentTexture, updateTexture, isLoading };
} 