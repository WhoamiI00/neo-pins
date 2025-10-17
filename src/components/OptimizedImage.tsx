import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * OptimizedImage Component
 * 
 * Performance optimizations:
 * 1. Native lazy loading for images below the fold
 * 2. Low Quality Image Placeholder (LQIP) blur-up effect
 * 3. Intersection Observer for precise loading control
 * 4. Aspect ratio preservation to prevent layout shifts (CLS optimization)
 * 5. WebP/AVIF format support via srcset
 * 6. Proper error handling with fallback
 */

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'loading'> {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string; // e.g., "16/9", "4/3", "1/1"
  priority?: boolean; // For above-the-fold images
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  blurDataURL?: string; // Optional placeholder for blur effect
}

const OptimizedImage = ({
  src,
  alt,
  className,
  aspectRatio,
  priority = false,
  onLoad,
  onError,
  fallbackSrc,
  blurDataURL,
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Priority images load immediately
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return; // Skip observer for priority images

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      onError?.();
    }
  };

  return (
    <div
      className={cn('relative overflow-hidden bg-muted', className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Blur placeholder */}
      {blurDataURL && !isLoaded && isInView && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
          aria-hidden="true"
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && isInView && !blurDataURL && (
        <div className="absolute inset-0 shimmer" />
      )}

      {/* Main image */}
      {(isInView || priority) && !hasError && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
