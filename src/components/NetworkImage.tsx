import React, { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useNetwork } from '@/contexts/NetworkContext';

interface NetworkImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: 'blur' | 'empty' | string;
  sizes?: string;
}

interface ImageLayer {
  src: string;
  quality: number;
  loaded: boolean;
  loading: boolean;
  error: boolean;
}

const NetworkImage: React.FC<NetworkImageProps> = ({
  src,
  alt,
  className,
  width = 400,
  height,
  priority = false,
  onLoad,
  onError,
  placeholder = 'blur',
  sizes,
}) => {
  const { quality, speed, getOptimalImageParams, metrics } = useNetwork();
  const [currentLayer, setCurrentLayer] = useState<'base' | 'enhancement' | 'premium'>('base');
  const [layers, setLayers] = useState<Record<string, ImageLayer>>({});
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Generate progressive image URLs
  const imageLayers = useMemo(() => {
    const baseParams = getOptimalImageParams(width);
    
    const generateUrl = (w: number, q: number, format: string) => {
      if (!src.includes('.supabase.co/storage/')) return src;
      
      const url = new URL(src);
      url.searchParams.set('width', w.toString());
      url.searchParams.set('quality', q.toString());
      url.searchParams.set('format', format);
      return url.toString();
    };

    return {
      base: {
        src: generateUrl(Math.round(width * 0.3), 30, 'jpeg'),
        quality: 30,
        loaded: false,
        loading: false,
        error: false,
      },
      enhancement: {
        src: generateUrl(baseParams.width, baseParams.quality, baseParams.format),
        quality: baseParams.quality,
        loaded: false,
        loading: false,
        error: false,
      },
      premium: {
        src: generateUrl(width * 2, 95, 'webp'),
        quality: 95,
        loaded: false,
        loading: false,
        error: false,
      },
    };
  }, [src, width, quality, getOptimalImageParams]);

  // Initialize layers
  useEffect(() => {
    setLayers(imageLayers);
    setCurrentLayer('base');
  }, [imageLayers]);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (priority) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [priority]);

  // Progressive loading logic
  useEffect(() => {
    if (!isInView) return;

    const loadLayer = async (layerKey: string, layer: ImageLayer) => {
      if (layer.loaded || layer.loading || layer.error) return;

      setLayers(prev => ({
        ...prev,
        [layerKey]: { ...prev[layerKey], loading: true }
      }));

      try {
        await preloadImage(layer.src);
        
        setLayers(prev => ({
          ...prev,
          [layerKey]: { ...prev[layerKey], loaded: true, loading: false }
        }));

        // Update current layer based on network quality and loaded state
        if (layerKey === 'base') {
          setCurrentLayer('base');
          // Immediately start loading enhancement layer
          setTimeout(() => loadEnhancementLayer(), 100);
        } else if (layerKey === 'enhancement') {
          setCurrentLayer('enhancement');
          // Load premium layer only for fast connections
          if (speed === 'fast' && quality === 'premium') {
            setTimeout(() => loadPremiumLayer(), 200);
          }
        } else if (layerKey === 'premium') {
          setCurrentLayer('premium');
        }

        onLoad?.();
      } catch (error) {
        console.warn(`Failed to load ${layerKey} layer:`, error);
        setLayers(prev => ({
          ...prev,
          [layerKey]: { ...prev[layerKey], error: true, loading: false }
        }));
        onError?.();
      }
    };

    const loadEnhancementLayer = () => {
      if (quality !== 'minimal' && speed !== 'offline') {
        loadLayer('enhancement', layers.enhancement);
      }
    };

    const loadPremiumLayer = () => {
      if (quality === 'premium' && speed === 'fast' && metrics.bandwidth > 5) {
        loadLayer('premium', layers.premium);
      }
    };

    // Start with base layer
    loadLayer('base', layers.base);

  }, [isInView, layers, quality, speed, metrics.bandwidth, onLoad, onError]);

  // Image preloader utility
  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  };

  // Get current image source
  const getCurrentSrc = () => {
    const layer = layers[currentLayer];
    if (layer?.loaded) return layer.src;
    
    // Fallback to lower quality if current layer failed
    if (currentLayer === 'premium' && layers.enhancement?.loaded) {
      return layers.enhancement.src;
    }
    if ((currentLayer === 'premium' || currentLayer === 'enhancement') && layers.base?.loaded) {
      return layers.base.src;
    }
    
    return src; // Original fallback
  };

  // Generate placeholder
  const getPlaceholder = () => {
    if (placeholder === 'empty') return null;
    if (placeholder === 'blur') {
      return (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted animate-pulse"
          style={{
            filter: 'blur(10px)',
            transform: 'scale(1.1)',
          }}
        />
      );
    }
    if (typeof placeholder === 'string') {
      return (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      );
    }
    return null;
  };

  // Loading state indicator
  const isLoading = !layers[currentLayer]?.loaded && (layers.base?.loading || layers.enhancement?.loading || layers.premium?.loading);
  const hasLoaded = layers[currentLayer]?.loaded;

  return (
    <div className="relative overflow-hidden">
      {/* Placeholder */}
      {!hasLoaded && getPlaceholder()}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={getCurrentSrc()}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'transition-all duration-500 ease-out',
          hasLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        style={{
          aspectRatio: height ? `${width}/${height}` : undefined,
        }}
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes}
      />

      {/* Quality indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {currentLayer} ({layers[currentLayer]?.quality}q)
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute bottom-2 right-2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      )}

      {/* Network speed indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {speed} / {quality}
        </div>
      )}
    </div>
  );
};

export default NetworkImage;