import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { TradingChart } from "@/components/trading/TradingChart";
import { AISignalPanel } from "@/components/ai/AISignalPanel";
import { RiskMonitor } from "@/components/risk/RiskMonitor";
import { NewsPanel } from "@/components/news/NewsPanel";
import { AccountStatus } from "@/components/account/AccountStatus";
import { ModelSelector } from "@/components/ai/ModelSelector";
import { SystemMetrics } from "@/components/system/SystemMetrics";
import { Activity, Brain, Shield, TrendingUp, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface MarketData {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  timestamp: string;
}

const Index = () => {
  const { toast } = useToast();
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [systemStatus, setSystemStatus] = useState({
    mt5Connected: false,
    aiModelActive: false,
    riskMonitorActive: true,
  });

  useEffect(() => {
    // Subscribe to real-time market data
    const subscription = supabase
      .channel('market-data-stream')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'market_data_stream',
        filter: 'symbol=eq.XAUUSD'
      }, (payload) => {
        setMarketData({
          symbol: payload.new.symbol,
          bid: payload.new.bid,
          ask: payload.new.ask,
          last: payload.new.last,
          timestamp: payload.new.timestamp,
        });
      })
      .subscribe();

    // Fetch initial market data
    const fetchInitialData = async () => {
      const { data, error } = await supabase
        .from('market_data_stream')
        .select('*')
        .eq('symbol', 'XAUUSD')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setMarketData({
          symbol: data[0].symbol,
          bid: data[0].bid,
          ask: data[0].ask,
          last: data[0].last,
          timestamp: data[0].timestamp,
        });
      }
    };

    fetchInitialData();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSystemToggle = (system: string) => {
    setSystemStatus(prev => ({
      ...prev,
      [system]: !prev[system as keyof typeof prev]
    }));

    toast({
      title: "System Status Updated",
      description: `${system} has been ${systemStatus[system as keyof typeof systemStatus] ? 'disabled' : 'enabled'}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-terminal p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-gradient-gold rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sentinel Gold Trader</h1>
            <p className="text-sm text-muted-foreground">AI-Powered XAUUSD Scalping System</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={systemStatus.mt5Connected ? "default" : "destructive"} className="gap-1">
            <Activity className="h-3 w-3" />
            MT5 {systemStatus.mt5Connected ? "Connected" : "Disconnected"}
          </Badge>
          <Badge variant={systemStatus.aiModelActive ? "default" : "secondary"} className="gap-1">
            <Brain className="h-3 w-3" />
            AI {systemStatus.aiModelActive ? "Active" : "Standby"}
          </Badge>
          <Badge variant="default" className="gap-1">
            <Shield className="h-3 w-3" />
            Risk Monitor Active
          </Badge>
        </div>
      </div>

      {/* Real-time Market Data */}
      {marketData && (
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-primary">XAUUSD</div>
              <div className="text-lg text-foreground">{marketData.last.toFixed(2)}</div>
              <div className="flex gap-2 text-sm">
                <span className="text-buy">Bid: {marketData.bid.toFixed(2)}</span>
                <span className="text-sell">Ask: {marketData.ask.toFixed(2)}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Last Update: {new Date(marketData.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </Card>
      )}

      {/* Main Trading Interface */}
      <div className="grid grid-cols-12 gap-4">
        {/* Trading Chart - Main Area */}
        <div className="col-span-8">
          <TradingChart />
        </div>

        {/* AI Signals & Controls */}
        <div className="col-span-4 space-y-4">
          <AISignalPanel />
          <ModelSelector />
          <RiskMonitor />
        </div>
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-12 gap-4">
        {/* System Metrics & Performance */}
        <div className="col-span-4">
          <SystemMetrics />
        </div>

        {/* Account Status */}
        <div className="col-span-4">
          <AccountStatus />
        </div>

        {/* News Feed */}
        <div className="col-span-4">
          <NewsPanel />
        </div>
      </div>

      {/* System Controls */}
      <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">System Controls</h3>
          <div className="flex gap-2">
            <Button 
              variant={systemStatus.mt5Connected ? "destructive" : "default"}
              size="sm"
              onClick={() => handleSystemToggle('mt5Connected')}
            >
              <Activity className="h-4 w-4 mr-2" />
              {systemStatus.mt5Connected ? 'Disconnect MT5' : 'Connect MT5'}
            </Button>
            <Button 
              variant={systemStatus.aiModelActive ? "secondary" : "default"}
              size="sm"
              onClick={() => handleSystemToggle('aiModelActive')}
            >
              <Brain className="h-4 w-4 mr-2" />
              {systemStatus.aiModelActive ? 'Pause AI' : 'Activate AI'}
            </Button>
            <Button variant="outline" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Emergency Stop
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Index;
