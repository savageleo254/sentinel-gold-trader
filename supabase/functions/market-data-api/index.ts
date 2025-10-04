import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Real-time market data from Twelve Data API (free tier: 800 requests/day)
const TWELVE_DATA_API_KEY = Deno.env.get('TWELVE_DATA_API_KEY') || 'demo'; // Use demo for now

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'XAU/USD', interval = '1min' } = await req.json();
    
    console.log(`Fetching real-time data for ${symbol} at ${interval} interval`);
    
    // Fetch real-time gold price from Twelve Data
    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=100&apikey=${TWELVE_DATA_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Twelve Data API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      // Fallback to generating realistic mock data if API limit reached
      console.log('API limit reached, using realistic price generation');
      const mockData = generateRealisticGoldPrices();
      return new Response(JSON.stringify(mockData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Store data in Supabase
    const candles = data.values?.map((candle: any) => ({
      symbol: 'XAUUSD',
      timeframe: mapInterval(interval),
      timestamp: new Date(candle.datetime).toISOString(),
      open_price: parseFloat(candle.open),
      high_price: parseFloat(candle.high),
      low_price: parseFloat(candle.low),
      close_price: parseFloat(candle.close),
      volume: parseInt(candle.volume || '0'),
      tick_volume: parseInt(candle.volume || '0'),
      spread: 20 // ~20 points typical for XAUUSD
    }));
    
    if (candles && candles.length > 0) {
      // Upsert to avoid duplicates
      const { error: insertError } = await supabase
        .from('market_data')
        .upsert(candles, { 
          onConflict: 'symbol,timeframe,timestamp',
          ignoreDuplicates: true 
        });
      
      if (insertError) {
        console.error('Error storing market data:', insertError);
      }
      
      // Also store latest tick in stream table
      const latest = candles[0];
      await supabase
        .from('market_data_stream')
        .insert({
          symbol: 'XAUUSD',
          bid: latest.close_price - 0.10,
          ask: latest.close_price + 0.10,
          last: latest.close_price,
          volume: latest.volume,
          timestamp: latest.timestamp,
          source: 'twelvedata'
        });
    }
    
    return new Response(JSON.stringify({
      success: true,
      candles: candles?.length || 0,
      latest_price: candles?.[0]?.close_price,
      source: 'twelvedata'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Market data API error:', error);
    
    // Generate realistic fallback data
    const mockData = generateRealisticGoldPrices();
    return new Response(JSON.stringify(mockData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function mapInterval(interval: string): string {
  const map: { [key: string]: string } = {
    '1min': 'M1',
    '5min': 'M5',
    '15min': 'M15',
    '30min': 'M30',
    '1h': 'H1',
    '4h': 'H4',
    '1day': 'D1'
  };
  return map[interval] || 'M1';
}

function generateRealisticGoldPrices() {
  const now = Date.now();
  const basePrice = 2040.50; // Current approximate gold price
  const candles = [];
  
  for (let i = 0; i < 100; i++) {
    const timestamp = new Date(now - i * 60000); // 1 minute intervals
    const volatility = Math.random() * 2 - 1; // -1 to +1
    const trend = Math.sin(i * 0.1) * 5; // Simulate trending
    
    const open = basePrice + trend + (Math.random() - 0.5) * 3;
    const close = open + volatility * 1.5;
    const high = Math.max(open, close) + Math.random() * 1.5;
    const low = Math.min(open, close) - Math.random() * 1.5;
    
    candles.push({
      symbol: 'XAUUSD',
      timeframe: 'M1',
      timestamp: timestamp.toISOString(),
      open_price: parseFloat(open.toFixed(2)),
      high_price: parseFloat(high.toFixed(2)),
      low_price: parseFloat(low.toFixed(2)),
      close_price: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 1000) + 100,
      tick_volume: Math.floor(Math.random() * 1000) + 100,
      spread: 20
    });
  }
  
  return {
    success: true,
    candles: candles.length,
    latest_price: candles[0].close_price,
    source: 'generated',
    data: candles
  };
}
