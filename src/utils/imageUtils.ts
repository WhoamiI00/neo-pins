// Enhanced utility functions for network-based image rendering

export type NetworkSpeed = 'fast' | 'medium' | 'slow' | 'offline';
export type ImageQuality = 'minimal' | 'basic' | 'standard' | 'premium';
export type ImageFormat = 'jpeg' | 'webp' | 'avif';

interface ImageTransformParams {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  blur?: number;
  sharpen?: boolean;
}

interface ProgressiveImageConfig {
  base: ImageTransformParams;
  enhancement: ImageTransformParams;
  premium: ImageTransformParams;
}

// Legacy mapping for backward compatibility
const legacyQualityMap = {
  'low': 'basic' as const,
  'medium': 'standard' as const,
  'high': 'premium' as const,
};

export const getOptimalImageQuality = (networkSpeed: NetworkSpeed): ImageQuality => {
  switch (networkSpeed) {
    case 'fast':
      return 'premium';
    case 'medium':
      return 'standard';
    case 'slow':
      return 'basic';
    case 'offline':
      return 'minimal';
    default:
      return 'standard';
  }
};

// Advanced progressive image configuration generator
export const generateProgressiveConfig = (
  baseWidth: number,
  networkSpeed: NetworkSpeed,
  saveData: boolean = false
): ProgressiveImageConfig => {
  const qualityMultiplier = saveData ? 0.7 : 1;
  
  return {
    base: {
      width: Math.round(baseWidth * 0.3),
      quality: Math.round(35 * qualityMultiplier),
      format: 'jpeg',
      blur: 2,
    },
    enhancement: {
      width: baseWidth,
      quality: Math.round(70 * qualityMultiplier),
      format: 'webp',
      sharpen: true,
    },
    premium: {
      width: baseWidth * 2,
      quality: Math.round(90 * qualityMultiplier),
      format: 'webp',
      sharpen: true,
    },
  };
};

// Enhanced responsive image URL generator with comprehensive transform support
export const getResponsiveImageUrl = (
  originalUrl: string, 
  params: ImageTransformParams,
  networkSpeed?: NetworkSpeed
): string => {
  // If it's a Supabase storage URL, apply transformations
  if (originalUrl.includes('.supabase.co/storage/')) {
    const url = new URL(originalUrl);
    
    // Apply width transformation
    if (params.width) {
      url.searchParams.set('width', params.width.toString());
    }
    
    // Apply height transformation
    if (params.height) {
      url.searchParams.set('height', params.height.toString());
    }
    
    // Apply quality transformation
    if (params.quality) {
      url.searchParams.set('quality', params.quality.toString());
    }
    
    // Apply format transformation
    if (params.format) {
      url.searchParams.set('format', params.format);
    }
    
    // Apply blur transformation
    if (params.blur) {
      url.searchParams.set('blur', params.blur.toString());
    }
    
    // Apply sharpening
    if (params.sharpen) {
      url.searchParams.set('sharpen', '1');
    }
    
    return url.toString();
  }
  
  // For external URLs, return as-is since we can't control their transformations
  return originalUrl;
};

// Legacy function for backward compatibility
export const getLegacyResponsiveImageUrl = (
  originalUrl: string, 
  quality: 'low' | 'medium' | 'high' = 'medium',
  networkSpeed?: NetworkSpeed
): string => {
  const mappedQuality = legacyQualityMap[quality];
  const finalQuality = networkSpeed ? getOptimalImageQuality(networkSpeed) : mappedQuality;
  
  const qualityParams: Record<ImageQuality, ImageTransformParams> = {
    minimal: { width: 200, quality: 30, format: 'jpeg' },
    basic: { width: 400, quality: 50, format: 'jpeg' },
    standard: { width: 800, quality: 70, format: 'webp' },
    premium: { width: 1600, quality: 90, format: 'webp' },
  };
  
  return getResponsiveImageUrl(originalUrl, qualityParams[finalQuality], networkSpeed);
};

// Enhanced image preloading with progress tracking and timeout
export interface PreloadOptions {
  timeout?: number;
  priority?: 'high' | 'low';
  onProgress?: (loaded: number, total: number) => void;
}

export const preloadImage = (
  src: string, 
  options: PreloadOptions = {}
): Promise<HTMLImageElement> => {
  const { timeout = 30000, priority = 'low' } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Set priority hint if supported
    if ('loading' in img && priority === 'high') {
      img.loading = 'eager';
    }
    
    // Timeout handler
    const timeoutId = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      reject(new Error(`Image preload timeout: ${src}`));
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };
    
    img.onerror = (error) => {
      clearTimeout(timeoutId);
      reject(new Error(`Image preload failed: ${src}`));
    };
    
    img.src = src;
  });
};

// Batch preload multiple images with concurrency control
export const preloadImages = async (
  urls: string[],
  options: PreloadOptions & { maxConcurrent?: number } = {}
): Promise<HTMLImageElement[]> => {
  const { maxConcurrent = 3, onProgress } = options;
  const results: HTMLImageElement[] = [];
  let completed = 0;
  
  const executeWithConcurrency = async (urlChunks: string[][]) => {
    for (const chunk of urlChunks) {
      const promises = chunk.map(async (url) => {
        try {
          const img = await preloadImage(url, options);
          completed++;
          onProgress?.(completed, urls.length);
          return img;
        } catch (error) {
          completed++;
          onProgress?.(completed, urls.length);
          throw error;
        }
      });
      
      const chunkResults = await Promise.allSettled(promises);
      chunkResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });
    }
  };
  
  // Split URLs into chunks for controlled concurrency
  const chunks: string[][] = [];
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    chunks.push(urls.slice(i, i + maxConcurrent));
  }
  
  await executeWithConcurrency(chunks);
  return results;
};

// Smart cache management for preloaded images
class ImageCache {
  private cache = new Map<string, HTMLImageElement>();
  private accessTimes = new Map<string, number>();
  private maxSize = 50;
  
  set(url: string, image: HTMLImageElement): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }
    
    this.cache.set(url, image);
    this.accessTimes.set(url, Date.now());
  }
  
  get(url: string): HTMLImageElement | undefined {
    const image = this.cache.get(url);
    if (image) {
      this.accessTimes.set(url, Date.now());
    }
    return image;
  }
  
  has(url: string): boolean {
    return this.cache.has(url);
  }
  
  private evictLeastRecentlyUsed(): void {
    let oldestTime = Infinity;
    let oldestUrl = '';
    
    for (const [url, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestUrl = url;
      }
    }
    
    if (oldestUrl) {
      this.cache.delete(oldestUrl);
      this.accessTimes.delete(oldestUrl);
    }
  }
  
  clear(): void {
    this.cache.clear();
    this.accessTimes.clear();
  }
}

export const imageCache = new ImageCache();