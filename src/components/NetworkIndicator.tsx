import React from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Activity, Zap, Clock, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({ 
  className, 
  showDetails = false 
}) => {
  const { speed, quality, metrics, isAssessing, reassessNetwork, forceQuality } = useNetwork();

  const getSpeedIcon = () => {
    switch (speed) {
      case 'fast':
        return <Zap className="h-3 w-3" />;
      case 'medium':
        return <Activity className="h-3 w-3" />;
      case 'slow':
        return <Clock className="h-3 w-3" />;
      case 'offline':
        return <WifiOff className="h-3 w-3" />;
      default:
        return <Wifi className="h-3 w-3" />;
    }
  };

  const getSpeedColor = () => {
    switch (speed) {
      case 'fast':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'slow':
        return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      case 'offline':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getQualityColor = () => {
    switch (quality) {
      case 'premium':
        return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      case 'standard':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'basic':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'minimal':
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  if (!showDetails) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs font-medium transition-colors",
            getSpeedColor(),
            isAssessing && "animate-pulse"
          )}
        >
          {getSpeedIcon()}
          <span className="ml-1 capitalize">{speed}</span>
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Speed and Quality Indicators */}
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs font-medium",
            getSpeedColor(),
            isAssessing && "animate-pulse"
          )}
        >
          {getSpeedIcon()}
          <span className="ml-1 capitalize">{speed}</span>
        </Badge>
        
        <Badge 
          variant="outline" 
          className={cn("text-xs font-medium", getQualityColor())}
        >
          <span className="capitalize">{quality}</span>
        </Badge>

        {isAssessing && (
          <Badge variant="outline" className="text-xs">
            <Activity className="h-3 w-3 mr-1 animate-spin" />
            Assessing
          </Badge>
        )}
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Bandwidth: {metrics.bandwidth.toFixed(1)} Mbps</div>
        <div>Latency: {metrics.latency}ms</div>
        <div>Type: {metrics.effectiveType}</div>
        <div>Data Saver: {metrics.saveData ? 'On' : 'Off'}</div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={reassessNetwork}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          disabled={isAssessing}
        >
          Reassess
        </button>
        
        <select
          value={quality}
          onChange={(e) => forceQuality(e.target.value as any)}
          className="text-xs bg-transparent border border-border rounded px-1 py-0.5"
        >
          <option value="minimal">Minimal</option>
          <option value="basic">Basic</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
        </select>
      </div>
    </div>
  );
};

export default NetworkIndicator;