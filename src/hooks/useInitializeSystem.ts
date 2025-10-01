import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useInitializeSystem = () => {
  const [initialized, setInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const { toast } = useToast();

  const initializeSystem = async () => {
    if (initialized || initializing) return;
    
    setInitializing(true);
    
    try {
      console.log('Initializing trading system...');
      
      // Call init-system edge function
      const { data, error } = await supabase.functions.invoke('init-system', {
        body: {}
      });

      if (error) {
        throw error;
      }

      console.log('System initialized:', data);
      setInitialized(true);
      
      toast({
        title: "System Initialized",
        description: "Trading system is ready with sample data. Connect MT5 Python service for real-time data.",
      });
      
    } catch (error) {
      console.error('Initialization error:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to initialize system. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setInitializing(false);
    }
  };

  // Check if system needs initialization
  useEffect(() => {
    const checkInitialization = async () => {
      try {
        // Check if we have any data
        const { data: accountData } = await supabase
          .from('trading_accounts')
          .select('id')
          .limit(1);

        const { data: marketData } = await supabase
          .from('market_data')
          .select('id')
          .limit(1);

        // If no data exists, initialize
        if (!accountData || accountData.length === 0 || !marketData || marketData.length === 0) {
          console.log('No data found, initializing system...');
          await initializeSystem();
        } else {
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error checking initialization:', error);
      }
    };

    checkInitialization();
  }, []);

  return { initialized, initializing, initializeSystem };
};
