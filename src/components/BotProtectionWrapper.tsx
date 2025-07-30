import { useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useBotProtection } from '@/hooks/useBotProtection';
import { toast } from 'sonner';

interface BotProtectionWrapperProps {
  children: ReactNode;
}

export const BotProtectionWrapper = ({ children }: BotProtectionWrapperProps) => {
  const { checkBotProtection } = useBotProtection();
  const location = useLocation();

  useEffect(() => {
    const performBotCheck = async () => {
      try {
        const result = await checkBotProtection(location.pathname);
        
        if (result && !result.allowed) {
          toast.error('Access denied: Bot protection activated', {
            description: `Reason: ${result.reason}`,
          });
        }
      } catch (error) {
        console.error('Bot protection check failed:', error);
      }
    };

    performBotCheck();
  }, [location.pathname, checkBotProtection]);

  return <>{children}</>;
};