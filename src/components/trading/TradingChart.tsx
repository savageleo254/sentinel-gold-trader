import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CandlestickData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const TradingChart = () => {
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [activeTimeframe, setActiveTimeframe] = useState("M1");
  const [trend, setTrend] = useState<"bullish" | "bearish" | "sideways">("sideways");

  useEffect(() => {
    const fetchChartData = async () => {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .eq('symbol', 'XAUUSD')
        .eq('timeframe', activeTimeframe)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (data && data.length > 0) {
        const formattedData = data.map(item => ({
          timestamp: item.timestamp,
          open: item.open_price,
          high: item.high_price,
          low: item.low_price,
          close: item.close_price,
          volume: item.volume,
        })).reverse();
        
        setChartData(formattedData);
        
        // Simple trend detection
        if (formattedData.length >= 2) {
          const latest = formattedData[formattedData.length - 1];
          const previous = formattedData[formattedData.length - 2];
          
          if (latest.close > previous.close * 1.001) {
            setTrend("bullish");
          } else if (latest.close < previous.close * 0.999) {
            setTrend("bearish");
          } else {
            setTrend("sideways");
          }
        }
      }
    };

    fetchChartData();
    const interval = setInterval(fetchChartData, 1000); // Update every second for M1

    return () => clearInterval(interval);
  }, [activeTimeframe]);

  const timeframes = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border h-96">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">XAUUSD Chart</h3>
          <Badge 
            variant={trend === "bullish" ? "default" : trend === "bearish" ? "destructive" : "secondary"}
            className="gap-1"
          >
            {trend === "bullish" ? <TrendingUp className="h-3 w-3" /> : 
             trend === "bearish" ? <TrendingDown className="h-3 w-3" /> : 
             <Activity className="h-3 w-3" />}
            {trend.toUpperCase()}
          </Badge>
        </div>
        
        <Tabs value={activeTimeframe} onValueChange={setActiveTimeframe}>
          <TabsList className="bg-secondary/50">
            {timeframes.map(tf => (
              <TabsTrigger key={tf} value={tf} className="text-xs">
                {tf}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="relative h-80 bg-gradient-terminal rounded-lg border border-border overflow-hidden">
        {/* Chart Placeholder - In production, integrate with a proper charting library */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="h-32 w-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded animate-pulse"></div>
            <p className="text-sm text-muted-foreground">
              Real-time XAUUSD Chart ({activeTimeframe})
            </p>
            <div className="flex justify-center gap-4 text-sm">
              {chartData.length > 0 && (
                <>
                  <span className="text-buy">O: {chartData[chartData.length - 1]?.open.toFixed(2)}</span>
                  <span className="text-primary">H: {chartData[chartData.length - 1]?.high.toFixed(2)}</span>
                  <span className="text-sell">L: {chartData[chartData.length - 1]?.low.toFixed(2)}</span>
                  <span className="text-foreground">C: {chartData[chartData.length - 1]?.close.toFixed(2)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* AI Signal Overlays */}
        <div className="absolute top-4 left-4 space-y-1">
          <Badge variant="outline" className="bg-ai-strong/20 border-ai-strong text-ai-strong">
            AI Signal: STRONG BUY
          </Badge>
          <Badge variant="outline" className="bg-ai-medium/20 border-ai-medium text-ai-medium">
            Confidence: 87%
          </Badge>
        </div>

        {/* Risk Levels */}
        <div className="absolute top-4 right-4 space-y-1 text-right">
          <div className="text-xs text-buy">TP: 2,045.50</div>
          <div className="text-xs text-sell">SL: 2,035.20</div>
          <div className="text-xs text-warning">R:R 1:2.5</div>
        </div>
      </div>
    </Card>
  );
};