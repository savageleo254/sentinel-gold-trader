import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ColorType, CandlestickSeries } from 'lightweight-charts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const TradingViewChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const [activeTimeframe, setActiveTimeframe] = useState('M1');
  const [trend, setTrend] = useState<'bullish' | 'bearish' | 'sideways'>('sideways');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: 'rgba(197, 203, 206, 0.4)',
      },
      timeScale: {
        borderColor: 'rgba(197, 203, 206, 0.4)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Fetch and update chart data
  useEffect(() => {
    const fetchChartData = async () => {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .eq('symbol', 'XAUUSD')
        .eq('timeframe', activeTimeframe)
        .order('timestamp', { ascending: true })
        .limit(500);

      if (data && data.length > 0 && candlestickSeriesRef.current) {
        const chartData = data.map(item => ({
          time: item.timestamp.split('.')[0].replace('T', ' ') as any,
          open: Number(item.open_price),
          high: Number(item.high_price),
          low: Number(item.low_price),
          close: Number(item.close_price),
        }));

        candlestickSeriesRef.current.setData(chartData);

        // Update current price and trend
        const latest = chartData[chartData.length - 1];
        const previous = chartData[chartData.length - 2];
        
        if (latest && previous) {
          setCurrentPrice(latest.close);
          const change = ((latest.close - previous.close) / previous.close) * 100;
          setPriceChange(change);

          if (latest.close > previous.close * 1.0005) {
            setTrend('bullish');
          } else if (latest.close < previous.close * 0.9995) {
            setTrend('bearish');
          } else {
            setTrend('sideways');
          }
        }

        // Fit content
        chartRef.current?.timeScale().fitContent();
      }
    };

    fetchChartData();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('market-data-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'market_data',
          filter: `symbol=eq.XAUUSD,timeframe=eq.${activeTimeframe}`
        },
        (payload: any) => {
          if (candlestickSeriesRef.current && payload.new) {
            const newCandle = {
              time: payload.new.timestamp.split('.')[0].replace('T', ' ') as any,
              open: Number(payload.new.open_price),
              high: Number(payload.new.high_price),
              low: Number(payload.new.low_price),
              close: Number(payload.new.close_price),
            };
            candlestickSeriesRef.current.update(newCandle);
            setCurrentPrice(newCandle.close);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTimeframe]);

  const timeframes = [
    { value: 'M1', label: '1M' },
    { value: 'M5', label: '5M' },
    { value: 'M15', label: '15M' },
    { value: 'M30', label: '30M' },
    { value: 'H1', label: '1H' },
    { value: 'H4', label: '4H' },
    { value: 'D1', label: '1D' },
  ];

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">XAUUSD</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                ${currentPrice.toFixed(2)}
              </span>
              <span className={`text-sm ${priceChange >= 0 ? 'text-buy' : 'text-sell'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
          <Badge 
            variant={trend === 'bullish' ? 'default' : trend === 'bearish' ? 'destructive' : 'secondary'}
            className="gap-1"
          >
            {trend === 'bullish' ? <TrendingUp className="h-3 w-3" /> : 
             trend === 'bearish' ? <TrendingDown className="h-3 w-3" /> : 
             <Activity className="h-3 w-3" />}
            {trend.toUpperCase()}
          </Badge>
        </div>
        
        <Tabs value={activeTimeframe} onValueChange={setActiveTimeframe}>
          <TabsList className="bg-secondary/50">
            {timeframes.map(tf => (
              <TabsTrigger key={tf.value} value={tf.value} className="text-xs">
                {tf.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div ref={chartContainerRef} className="w-full" />
    </Card>
  );
};
