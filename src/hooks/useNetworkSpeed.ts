import { useState, useEffect } from 'react';

type NetworkSpeed = 'fast' | 'medium' | 'slow';

export const useNetworkSpeed = () => {
  const [networkSpeed, setNetworkSpeed] = useState<NetworkSpeed>('medium');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectNetworkSpeed = async () => {
      try {
        // Use the Network Information API if available
        if ('connection' in navigator) {
          const connection = (navigator as any).connection;
          const effectiveType = connection?.effectiveType;
          
          switch (effectiveType) {
            case '4g':
              setNetworkSpeed('fast');
              break;
            case '3g':
              setNetworkSpeed('medium');
              break;
            case '2g':
            case 'slow-2g':
              setNetworkSpeed('slow');
              break;
            default:
              setNetworkSpeed('medium');
          }
        } else {
          // Fallback: Measure download speed with a small image
          const startTime = Date.now();
          const testImage = new Image();
          
          testImage.onload = () => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Simple heuristic based on load time
            if (duration < 500) {
              setNetworkSpeed('fast');
            } else if (duration < 1500) {
              setNetworkSpeed('medium');
            } else {
              setNetworkSpeed('slow');
            }
          };
          
          testImage.onerror = () => {
            setNetworkSpeed('medium'); // Default fallback
          };
          
          // Use a small test image (1x1 pixel)
          testImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        }
      } catch (error) {
        console.warn('Network speed detection failed:', error);
        setNetworkSpeed('medium');
      } finally {
        setIsLoading(false);
      }
    };

    detectNetworkSpeed();

    // Listen for network changes
    const handleNetworkChange = () => {
      detectNetworkSpeed();
    };

    if ('connection' in navigator) {
      (navigator as any).connection?.addEventListener('change', handleNetworkChange);
    }

    return () => {
      if ('connection' in navigator) {
        (navigator as any).connection?.removeEventListener('change', handleNetworkChange);
      }
    };
  }, []);

  return { networkSpeed, isLoading };
};