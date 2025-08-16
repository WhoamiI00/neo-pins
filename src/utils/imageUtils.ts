// Utility functions for responsive image loading

type NetworkSpeed = 'fast' | 'medium' | 'slow';
type ImageQuality = 'low' | 'medium' | 'high';

export const getOptimalImageQuality = (networkSpeed: NetworkSpeed): ImageQuality => {
  switch (networkSpeed) {
    case 'fast':
      return 'high';
    case 'medium':
      return 'medium';
    case 'slow':
      return 'low';
    default:
      return 'medium';
  }
};

export const getResponsiveImageUrl = (
  originalUrl: string, 
  quality: ImageQuality = 'medium',
  networkSpeed?: NetworkSpeed
): string => {
  // If network speed is provided, override quality
  const finalQuality = networkSpeed ? getOptimalImageQuality(networkSpeed) : quality;
  
  // If it's a Supabase storage URL, we can add transformation parameters
  if (originalUrl.includes('.supabase.co/storage/')) {
    const url = new URL(originalUrl);
    
    switch (finalQuality) {
      case 'low':
        url.searchParams.set('width', '300');
        url.searchParams.set('quality', '50');
        break;
      case 'medium':
        url.searchParams.set('width', '600');
        url.searchParams.set('quality', '70');
        break;
      case 'high':
        // Remove any existing resize parameters for full quality
        url.searchParams.delete('width');
        url.searchParams.delete('quality');
        break;
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