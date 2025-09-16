import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Cpu, HardDrive, Activity, Zap, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SystemMetric {
  id: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  open_positions: number;
  active_strategies: number;
  mt5_connected: boolean;
  gemini_connected: boolean;
  timestamp: string;
}

export const SystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetric | null>(null);
  const [performance, setPerformance] = useState({
    uptime: "2d 14h 32m",
    tradingSession: "London Open",
    latency: 12,
    throughput: 1450,
  });

  useEffect(() => {
    const fetchSystemMetrics = async () => {
      const { data, error } = await supabase
        .from('system_metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setMetrics(data[0]);
      }
    };

    fetchSystemMetrics();
    
    // Update metrics every 3 seconds
    const interval = setInterval(fetchSystemMetrics, 3000);

    return () => clearInterval(interval);
  }, []);

  const getUsageColor = (usage: number) => {
    if (usage >= 80) return "text-destructive";
    if (usage >= 60) return "text-warning";
    return "text-success";
  };

  const getConnectionStatus = (connected: boolean) => {
    return connected ? (
      <Badge variant="default" className="gap-1">
        <Wifi className="h-3 w-3" />
        Connected
      </Badge>
    ) : (
      <Badge variant="destructive" className="gap-1">
        <WifiOff className="h-3 w-3" />
        Disconnected
      </Badge>
    );
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-r from-primary/60 via-success to-primary/60 rounded-lg">
          <Activity className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">System Metrics</h3>
          <p className="text-xs text-muted-foreground">Lenovo T470 Performance</p>
        </div>
      </div>

      {metrics ? (
        <div className="space-y-4">
          {/* Resource Usage */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">CPU Usage</span>
                </div>
                <span className={`text-sm font-medium ${getUsageColor(metrics.cpu_usage)}`}>
                  {metrics.cpu_usage.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.cpu_usage} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Memory</span>
                </div>
                <span className={`text-sm font-medium ${getUsageColor(metrics.memory_usage)}`}>
                  {metrics.memory_usage.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.memory_usage} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Disk Usage</span>
                </div>
                <span className={`text-sm font-medium ${getUsageColor(metrics.disk_usage)}`}>
                  {metrics.disk_usage.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.disk_usage} className="h-2" />
            </div>
          </div>

          {/* Connection Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Connections</h4>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">MT5 Bridge</span>
              {getConnectionStatus(metrics.mt5_connected)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Gemini AI</span>
              {getConnectionStatus(metrics.gemini_connected)}
            </div>
          </div>

          {/* Trading Activity */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-secondary/10 rounded text-center">
              <p className="text-lg font-bold text-primary">{metrics.open_positions}</p>
              <p className="text-xs text-muted-foreground">Open Positions</p>
            </div>
            <div className="p-2 bg-secondary/10 rounded text-center">
              <p className="text-lg font-bold text-primary">{metrics.active_strategies}</p>
              <p className="text-xs text-muted-foreground">Active Strategies</p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Performance</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uptime:</span>
                <span className="text-foreground">{performance.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session:</span>
                <span className="text-foreground">{performance.tradingSession}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latency:</span>
                <span className="text-success">{performance.latency}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Throughput:</span>
                <span className="text-foreground">{performance.throughput}/s</span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="p-2 bg-success/10 border border-success/20 rounded text-xs">
            <div className="flex items-center gap-1 text-success">
              <Zap className="h-3 w-3" />
              <span className="font-medium">System Optimized</span>
            </div>
            <p className="text-muted-foreground mt-1">
              All systems running efficiently on T470 hardware
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading system metrics...</p>
        </div>
      )}
    </Card>
  );
};