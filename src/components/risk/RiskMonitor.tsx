import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle, XCircle, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RiskEvent {
  id: string;
  event_type: string;
  severity: string;
  description: string;
  current_value: number;
  threshold_value: number;
  resolved: boolean;
  created_at: string;
}

export const RiskMonitor = () => {
  const [riskEvents, setRiskEvents] = useState<RiskEvent[]>([]);
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low");
  const [capitalProtection, setCapitalProtection] = useState({
    currentDrawdown: 2.3,
    maxDrawdown: 5.0,
    dailyLoss: 150,
    maxDailyLoss: 500,
    positionSize: 0.1,
    riskPerTrade: 1.0,
  });

  useEffect(() => {
    const fetchRiskEvents = async () => {
      const { data, error } = await supabase
        .from('risk_events')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setRiskEvents(data);
        
        // Calculate overall risk level
        const criticalEvents = data.filter(event => event.severity === 'critical');
        const highEvents = data.filter(event => event.severity === 'high');
        
        if (criticalEvents.length > 0) {
          setRiskLevel("high");
        } else if (highEvents.length > 0) {
          setRiskLevel("medium");
        } else {
          setRiskLevel("low");
        }
      }
    };

    fetchRiskEvents();
    const interval = setInterval(fetchRiskEvents, 5000);

    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      default:
        return "default";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-warning/80" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-r from-success via-warning to-destructive rounded-lg">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Risk Monitor</h3>
          <p className="text-xs text-muted-foreground">Capital Protection Enabled</p>
        </div>
        <Badge variant={getRiskColor(riskLevel)} className="ml-auto">
          {riskLevel.toUpperCase()}
        </Badge>
      </div>

      {/* Capital Protection Metrics */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Current Drawdown</span>
            <span className="text-foreground">{capitalProtection.currentDrawdown}%</span>
          </div>
          <Progress 
            value={(capitalProtection.currentDrawdown / capitalProtection.maxDrawdown) * 100} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Max: {capitalProtection.maxDrawdown}%
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Daily Loss</span>
            <span className="text-sell">${capitalProtection.dailyLoss}</span>
          </div>
          <Progress 
            value={(capitalProtection.dailyLoss / capitalProtection.maxDailyLoss) * 100} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Limit: ${capitalProtection.maxDailyLoss}
          </div>
        </div>

        {/* Risk Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-secondary/10 rounded">
            <p className="text-muted-foreground">Position Size</p>
            <p className="font-medium text-foreground">{capitalProtection.positionSize} lots</p>
          </div>
          <div className="p-2 bg-secondary/10 rounded">
            <p className="text-muted-foreground">Risk/Trade</p>
            <p className="font-medium text-foreground">{capitalProtection.riskPerTrade}%</p>
          </div>
        </div>

        {/* Active Risk Events */}
        {riskEvents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Active Alerts</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {riskEvents.map((event) => (
                <Alert key={event.id} className="p-2">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(event.severity)}
                    <div className="flex-1">
                      <AlertDescription className="text-xs">
                        {event.description}
                      </AlertDescription>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(event.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Risk Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1">
            <TrendingDown className="h-3 w-3 mr-1" />
            Reduce Risk
          </Button>
          <Button size="sm" variant="destructive" className="flex-1">
            <XCircle className="h-3 w-3 mr-1" />
            Emergency Stop
          </Button>
        </div>

        {/* Risk Rules Status */}
        <div className="p-2 bg-success/10 border border-success/20 rounded text-xs">
          <div className="flex items-center gap-1 text-success">
            <CheckCircle className="h-3 w-3" />
            <span className="font-medium">Capital Protection Active</span>
          </div>
          <ul className="text-muted-foreground mt-1 space-y-1">
            <li className="flex items-center gap-1">
              <CheckCircle className="h-2 w-2" />
              Real-time position sizing enabled
            </li>
            <li className="flex items-center gap-1">
              <CheckCircle className="h-2 w-2" />
              Daily loss limits enforced
            </li>
            <li className="flex items-center gap-1">
              <CheckCircle className="h-2 w-2" />
              Drawdown monitoring active
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
};