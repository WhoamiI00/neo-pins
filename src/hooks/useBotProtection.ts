import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BotProtectionResult {
  allowed: boolean;
  conclusion: 'ALLOW' | 'DENY' | 'CHALLENGE';
  reason: string;
  ruleResults?: Array<{
    ttl: number;
    state: string;
    conclusion: 'ALLOW' | 'DENY' | 'CHALLENGE';
    reason: string;
  }>;
}

export const useBotProtection = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBotProtection = useCallback(async (path: string = '/'): Promise<BotProtectionResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // Get user's IP and user agent
      const userAgent = navigator.userAgent;
      
      // For IP detection, we'll use a simple approach
      // In production, you might want to use a more sophisticated method
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      const { data, error: functionError } = await supabase.functions.invoke('bot-protection', {
        body: {
          ip,
          userAgent,
          path
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      return data as BotProtectionResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bot protection check failed';
      setError(errorMessage);
      console.error('Bot protection error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checkBotProtection,
    loading,
    error
  };
};