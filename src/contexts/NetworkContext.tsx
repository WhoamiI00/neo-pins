import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NetworkMetrics {
  bandwidth: number; // Mbps
  latency: number; // ms
  jitter: number; // ms variation
  packetLoss: number; // percentage
  connectionType: string;
  effectiveType: string;
  saveData: boolean;
}

interface NetworkState {
  speed: 'fast' | 'medium' | 'slow' | 'offline';
  quality: 'premium' | 'standard' | 'basic' | 'minimal';
  metrics: NetworkMetrics;
  isAssessing: boolean;
  lastAssessment: number;
}

interface NetworkContextValue extends NetworkState {
  reassessNetwork: () => Promise<void>;
  forceQuality: (quality: NetworkState['quality']) => void;
  getOptimalImageParams: (baseWidth: number) => { width: number; quality: number; format: string };
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

const defaultMetrics: NetworkMetrics = {
  bandwidth: 1,
  latency: 100,
  jitter: 10,
  packetLoss: 0,
  connectionType: 'unknown',
  effectiveType: '3g',
  saveData: false,
};

const defaultState: NetworkState = {
  speed: 'medium',
  quality: 'standard',
  metrics: defaultMetrics,
  isAssessing: false,
  lastAssessment: 0,
};

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networkState, setNetworkState] = useState<NetworkState>(defaultState);

  // Enhanced network assessment with multiple metrics
  const assessNetworkQuality = async (): Promise<NetworkState> => {
    setNetworkState(prev => ({ ...prev, isAssessing: true }));

    try {
      const metrics = await runComprehensiveAssessment();
      const speed = determineSpeed(metrics);
      const quality = determineQuality(metrics, speed);

      const newState: NetworkState = {
        speed,
        quality,
        metrics,
        isAssessing: false,
        lastAssessment: Date.now(),
      };

      return newState;
    } catch (error) {
      console.warn('Network assessment failed:', error);
      return {
        ...defaultState,
        isAssessing: false,
        lastAssessment: Date.now(),
      };
    }
  };

  // Comprehensive network testing
  const runComprehensiveAssessment = async (): Promise<NetworkMetrics> => {
    const tests = await Promise.allSettled([
      measureBandwidth(),
      measureLatency(),
      getConnectionInfo(),
    ]);

    const [bandwidthResult, latencyResult, connectionResult] = tests;

    const bandwidth = bandwidthResult.status === 'fulfilled' ? bandwidthResult.value : 1;
    const { latency, jitter } = latencyResult.status === 'fulfilled' ? latencyResult.value : { latency: 100, jitter: 10 };
    const connectionInfo = connectionResult.status === 'fulfilled' ? connectionResult.value : { connectionType: 'unknown', effectiveType: '3g', saveData: false };

    return {
      bandwidth,
      latency,
      jitter,
      packetLoss: 0, // Simplified for now
      connectionType: connectionInfo.connectionType,
      effectiveType: connectionInfo.effectiveType,
      saveData: connectionInfo.saveData,
    };
  };

  // Measure download bandwidth using progressive loading
  const measureBandwidth = async (): Promise<number> => {
    const testSizes = [
      { size: '50kb', url: 'data:image/jpeg;base64,' + 'A'.repeat(50000) },
      { size: '200kb', url: 'data:image/jpeg;base64,' + 'B'.repeat(200000) },
    ];

    let totalBytes = 0;
    let totalTime = 0;

    for (const test of testSizes) {
      try {
        const startTime = performance.now();
        await fetch(test.url);
        const endTime = performance.now();
        
        const bytes = test.url.length;
        const timeSeconds = (endTime - startTime) / 1000;
        
        totalBytes += bytes;
        totalTime += timeSeconds;

        // Early exit for very slow connections
        if (timeSeconds > 5) break;
      } catch (error) {
        console.warn(`Bandwidth test failed for ${test.size}:`, error);
      }
    }

    // Calculate Mbps
    const mbps = totalTime > 0 ? (totalBytes * 8) / (totalTime * 1000000) : 1;
    return Math.max(0.1, Math.min(100, mbps)); // Clamp between 0.1 and 100 Mbps
  };

  // Measure latency and jitter
  const measureLatency = async (): Promise<{ latency: number; jitter: number }> => {
    const measurements: number[] = [];
    const testUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    for (let i = 0; i < 5; i++) {
      try {
        const startTime = performance.now();
        await fetch(testUrl + `?t=${Date.now()}`);
        const endTime = performance.now();
        measurements.push(endTime - startTime);
      } catch (error) {
        measurements.push(1000); // Default high latency for failed requests
      }
    }

    const latency = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const jitter = Math.sqrt(
      measurements.reduce((sum, val) => sum + Math.pow(val - latency, 2), 0) / measurements.length
    );

    return { latency: Math.round(latency), jitter: Math.round(jitter) };
  };

  // Get connection info from Navigator API
  const getConnectionInfo = async (): Promise<Partial<NetworkMetrics>> => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (!connection) {
      return {};
    }

    return {
      connectionType: connection.type || 'unknown',
      effectiveType: connection.effectiveType || '3g',
      saveData: connection.saveData || false,
    };
  };

  // Determine network speed classification
  const determineSpeed = (metrics: NetworkMetrics): NetworkState['speed'] => {
    if (!navigator.onLine) return 'offline';
    
    const { bandwidth, latency, effectiveType, saveData } = metrics;

    // User has data saver enabled
    if (saveData) return 'slow';

    // Primary classification by bandwidth and latency
    if (bandwidth >= 5 && latency < 100 && effectiveType === '4g') return 'fast';
    if (bandwidth >= 1.5 && latency < 300) return 'medium';
    return 'slow';
  };

  // Determine optimal quality setting
  const determineQuality = (metrics: NetworkMetrics, speed: NetworkState['speed']): NetworkState['quality'] => {
    if (speed === 'offline') return 'minimal';
    if (metrics.saveData) return 'basic';
    
    switch (speed) {
      case 'fast':
        return metrics.bandwidth >= 10 ? 'premium' : 'standard';
      case 'medium':
        return 'standard';
      case 'slow':
        return 'basic';
      default:
        return 'basic';
    }
  };

  // Get optimal image parameters based on network state
  const getOptimalImageParams = (baseWidth: number) => {
    const { quality, metrics } = networkState;
    
    const params = {
      premium: { 
        widthMultiplier: 2, 
        quality: 90, 
        format: 'webp' 
      },
      standard: { 
        widthMultiplier: 1.5, 
        quality: 75, 
        format: 'webp' 
      },
      basic: { 
        widthMultiplier: 1, 
        quality: 60, 
        format: 'jpeg' 
      },
      minimal: { 
        widthMultiplier: 0.5, 
        quality: 40, 
        format: 'jpeg' 
      },
    };

    const config = params[quality];
    return {
      width: Math.round(baseWidth * config.widthMultiplier),
      quality: metrics.saveData ? Math.min(config.quality, 50) : config.quality,
      format: config.format,
    };
  };

  // Reassess network function
  const reassessNetwork = async () => {
    const newState = await assessNetworkQuality();
    setNetworkState(newState);
  };

  // Force quality override
  const forceQuality = (quality: NetworkState['quality']) => {
    setNetworkState(prev => ({ ...prev, quality }));
  };

  // Initial assessment and periodic updates
  useEffect(() => {
    const performInitialAssessment = async () => {
      const initialState = await assessNetworkQuality();
      setNetworkState(initialState);
    };

    performInitialAssessment();

    // Reassess on network changes
    const handleOnline = () => reassessNetwork();
    const handleOffline = () => setNetworkState(prev => ({ ...prev, speed: 'offline', quality: 'minimal' }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic reassessment every 2 minutes
    const interval = setInterval(() => {
      if (Date.now() - networkState.lastAssessment > 120000) {
        reassessNetwork();
      }
    }, 120000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const contextValue: NetworkContextValue = {
    ...networkState,
    reassessNetwork,
    forceQuality,
    getOptimalImageParams,
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}