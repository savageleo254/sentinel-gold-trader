import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMarketDataSync = () => {
  const { toast } = useToast();

  useEffect(() => {
    const syncMarketData = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('market-data-api', {
          body: { symbol: 'XAU/USD', interval: '1min' }
        });

        if (error) {
          console.error('Market data sync error:', error);
        }
      } catch (err) {
        console.error('Failed to sync market data:', err);
      }
    };

    // Initial sync
    syncMarketData();

    // Sync every 60 seconds
    const interval = setInterval(syncMarketData, 60000);

    return () => clearInterval(interval);
  }, []);

  return null;
};
