import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Brain, TrendingUp, TrendingDown, Zap, Clock, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AISignal {
  id: string;
  signal_type: string;
  confidence: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  signal_time: string;
  status: string;
  model_prediction: any;
}

export const AISignalPanel = () => {
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [currentSignal, setCurrentSignal] = useState<AISignal | null>(null);
  const [signalStrength, setSignalStrength] = useState(0);

  useEffect(() => {
    const fetchSignals = async () => {
      const { data, error } = await supabase
        .from('trade_signals')
        .select('*')
        .eq('symbol', 'XAUUSD')
        .eq('status', 'active')
        .order('signal_time', { ascending: false })
        .limit(5);

      if (data) {
        setSignals(data);
        if (data.length > 0) {
          setCurrentSignal(data[0]);
          setSignalStrength(data[0].confidence * 100);
        }
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 2000);

    return () => clearInterval(interval);
  }, []);

  const getSignalColor = (confidence: number) => {
    if (confidence >= 0.8) return "ai-strong";
    if (confidence >= 0.6) return "ai-medium";
    return "ai-weak";
  };

  const getSignalIcon = (signalType: string) => {
    switch (signalType.toLowerCase()) {
      case 'buy':
      case 'long':
        return <TrendingUp className="h-4 w-4" />;
      case 'sell':
      case 'short':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-ai rounded-lg">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI Signal Panel</h3>
          <p className="text-xs text-muted-foreground">Three-Layer Fusion Analysis</p>
        </div>
      </div>

      {currentSignal ? (
        <div className="space-y-4">
          {/* Current Signal */}
          <div className="p-3 bg-secondary/20 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getSignalIcon(currentSignal.signal_type)}
                <span className="font-semibold text-foreground">
                  {currentSignal.signal_type.toUpperCase()}
                </span>
                <Badge className={`bg-${getSignalColor(currentSignal.confidence)}/20 border-${getSignalColor(currentSignal.confidence)} text-${getSignalColor(currentSignal.confidence)}`}>
                  {(currentSignal.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(currentSignal.signal_time).toLocaleTimeString()}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Entry</p>
                <p className="font-medium text-foreground">{currentSignal.entry_price?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Stop Loss</p>
                <p className="font-medium text-sell">{currentSignal.stop_loss?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Take Profit</p>
                <p className="font-medium text-buy">{currentSignal.take_profit?.toFixed(2)}</p>
              </div>
            </div>

            <Separator className="my-2" />

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Signal Strength</span>
                <span className="text-foreground">{signalStrength.toFixed(0)}%</span>
              </div>
              <Progress value={signalStrength} className="h-2" />
            </div>
          </div>

          {/* Signal Fusion Layers */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Fusion Analysis</h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between p-2 bg-secondary/10 rounded">
                <span className="text-xs text-muted-foreground">Primary Layer</span>
                <Badge variant="default" className="text-xs">BULLISH</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-secondary/10 rounded">
                <span className="text-xs text-muted-foreground">Sequential Layer</span>
                <Badge variant="secondary" className="text-xs">NEUTRAL</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-secondary/10 rounded">
                <span className="text-xs text-muted-foreground">Contextual Layer</span>
                <Badge variant="default" className="text-xs">BULLISH</Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-buy hover:bg-buy/80">
              <Target className="h-3 w-3 mr-1" />
              Execute Signal
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Clock className="h-3 w-3 mr-1" />
              Watch
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No active signals</p>
          <p className="text-xs text-muted-foreground">AI models are analyzing market conditions</p>
        </div>
      )}

      {/* Recent Signals */}
      {signals.length > 1 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Recent Signals</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {signals.slice(1, 4).map((signal) => (
              <div key={signal.id} className="flex items-center justify-between p-2 bg-secondary/5 rounded text-xs">
                <div className="flex items-center gap-2">
                  {getSignalIcon(signal.signal_type)}
                  <span>{signal.signal_type.toUpperCase()}</span>
                  <span className="text-muted-foreground">{signal.entry_price?.toFixed(2)}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {(signal.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};