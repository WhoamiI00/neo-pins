// Utility functions for responsive image loading

export const getResponsiveImageUrl = (originalUrl: string, quality: 'low' | 'high' = 'low'): string => {
  // If it's a Supabase storage URL, we can add transformation parameters
  if (originalUrl.includes('.supabase.co/storage/')) {
    const url = new URL(originalUrl);
    
    if (quality === 'low') {
      // Add resize parameters for half resolution and lower quality
      url.searchParams.set('width', '400');
      url.searchParams.set('quality', '60');
    } else {
      // Remove any existing resize parameters for full quality
      url.searchParams.delete('width');
      url.searchParams.delete('quality');
    }
    
    return url.toString();
  }
  
  // For external URLs, return as-is since we can't control their resolution
  return originalUrl;
};

export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};