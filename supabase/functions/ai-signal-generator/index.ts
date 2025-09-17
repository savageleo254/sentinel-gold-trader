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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'XAUUSD', timeframe = 'M5', model = 'openai' } = await req.json();
    
    console.log(`Generating AI signals for ${symbol} ${timeframe} using ${model}`);
    
    // Fetch recent market data for analysis
    const { data: marketData, error: marketError } = await supabase
      .from('market_data')
      .select('*')
      .eq('symbol', symbol)
      .eq('timeframe', timeframe)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (marketError || !marketData?.length) {
      throw new Error('Insufficient market data for analysis');
    }

    // Fetch news sentiment
    const { data: newsData } = await supabase
      .from('news_events')
      .select('*')
      .gte('published_at', new Date(Date.now() - 24*60*60*1000).toISOString())
      .order('published_at', { ascending: false })
      .limit(10);

    // Generate AI signal using selected model
    const signal = await generateTradingSignal(marketData, newsData || [], model);
    
    // Store the signal
    const { error: signalError } = await supabase
      .from('trade_signals')
      .insert({
        strategy_id: await getOrCreateStrategy('AI_SCALPING'),
        symbol,
        timeframe,
        signal_type: signal.type,
        confidence: signal.confidence,
        entry_price: signal.entryPrice,
        stop_loss: signal.stopLoss,
        take_profit: signal.takeProfit,
        position_size: signal.positionSize,
        signal_time: new Date().toISOString(),
        expiry_time: new Date(Date.now() + 15*60*1000).toISOString(), // 15 min expiry
        features: signal.features,
        model_prediction: signal.prediction,
        model_id: await getActiveModel()
      });

    if (signalError) {
      console.error('Signal storage error:', signalError);
    }

    // Log to trade journal
    await supabase
      .from('trade_journal')
      .insert({
        trade_id: crypto.randomUUID(),
        account_id: await getDefaultAccount(),
        symbol,
        action: 'SIGNAL_GENERATED',
        reason: `AI ${model} signal: ${signal.type}`,
        confidence: signal.confidence,
        model_prediction: signal.prediction,
        model_features: signal.features,
        trace_id: crypto.randomUUID()
      });

    return new Response(JSON.stringify({
      status: 'applied',
      patch: `AI signal generated: ${signal.type}`,
      checks: {
        signal_confidence: signal.confidence,
        risk_reward: signal.riskReward,
        market_conditions: signal.marketCondition
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI signal error:', error);
    return new Response(JSON.stringify({
      status: 'rejected',
      reason: error.message,
      guidance: ['Check market data availability', 'Verify AI model configuration', 'Review signal parameters']
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateTradingSignal(marketData: any[], newsData: any[], model: string) {
  const latest = marketData[0];
  const previous = marketData.slice(1, 21); // Last 20 candles
  
  // Technical indicators
  const sma20 = calculateSMA(marketData.slice(0, 20));
  const rsi = calculateRSI(marketData.slice(0, 14));
  const macd = calculateMACD(marketData.slice(0, 26));
  
  // Market structure analysis
  const trend = analyzeTrend(marketData.slice(0, 50));
  const support = findSupport(marketData.slice(0, 100));
  const resistance = findResistance(marketData.slice(0, 100));
  
  // News sentiment score
  const newsSentiment = calculateNewsSentiment(newsData);
  
  // Features for AI model
  const features = {
    price_action: {
      current_price: latest.close_price,
      sma20_distance: (latest.close_price - sma20) / sma20,
      rsi,
      macd_signal: macd.signal,
      macd_histogram: macd.histogram
    },
    market_structure: {
      trend_strength: trend.strength,
      trend_direction: trend.direction,
      support_distance: (latest.close_price - support) / latest.close_price,
      resistance_distance: (resistance - latest.close_price) / latest.close_price
    },
    news_sentiment: newsSentiment,
    volatility: calculateVolatility(marketData.slice(0, 20)),
    volume_profile: calculateVolumeProfile(marketData.slice(0, 20))
  };

  // AI decision logic based on features
  let signalType = 'HOLD';
  let confidence = 0.5;
  let entryPrice = latest.close_price;
  let stopLoss = entryPrice;
  let takeProfit = entryPrice;
  
  // HRM (High Risk Management) Scalping Strategy
  const scalping_conditions = analyzeScalpingConditions(features);
  
  if (scalping_conditions.bullish_signal && confidence > 0.75) {
    signalType = 'BUY';
    confidence = Math.min(0.95, scalping_conditions.strength);
    entryPrice = latest.ask || latest.close_price + 0.10;
    stopLoss = entryPrice - (entryPrice * 0.001); // 0.1% SL
    takeProfit = entryPrice + (entryPrice * 0.0025); // 0.25% TP (1:2.5 RR)
  } else if (scalping_conditions.bearish_signal && confidence > 0.75) {
    signalType = 'SELL';
    confidence = Math.min(0.95, scalping_conditions.strength);
    entryPrice = latest.bid || latest.close_price - 0.10;
    stopLoss = entryPrice + (entryPrice * 0.001); // 0.1% SL
    takeProfit = entryPrice - (entryPrice * 0.0025); // 0.25% TP (1:2.5 RR)
  }

  // Position sizing based on risk
  const accountBalance = 10000; // Get from account
  const riskPerTrade = 0.01; // 1% risk per trade
  const riskAmount = accountBalance * riskPerTrade;
  const stopLossDistance = Math.abs(entryPrice - stopLoss);
  const positionSize = riskAmount / stopLossDistance;

  return {
    type: signalType,
    confidence: Number(confidence.toFixed(3)),
    entryPrice: Number(entryPrice.toFixed(2)),
    stopLoss: Number(stopLoss.toFixed(2)),
    takeProfit: Number(takeProfit.toFixed(2)),
    positionSize: Number(positionSize.toFixed(2)),
    riskReward: Number(((takeProfit - entryPrice) / (entryPrice - stopLoss)).toFixed(2)),
    marketCondition: trend.direction,
    features,
    prediction: {
      model_used: model,
      confidence_breakdown: scalping_conditions,
      technical_score: (rsi + macd.signal + trend.strength) / 3,
      fundamental_score: newsSentiment
    }
  };
}

// Technical Analysis Functions
function calculateSMA(data: any[]) {
  const sum = data.reduce((acc, candle) => acc + candle.close_price, 0);
  return sum / data.length;
}

function calculateRSI(data: any[]) {
  if (data.length < 14) return 50;
  
  let gains = 0, losses = 0;
  for (let i = 1; i < data.length; i++) {
    const change = data[i-1].close_price - data[i].close_price;
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / 13;
  const avgLoss = losses / 13;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(data: any[]) {
  if (data.length < 26) return { signal: 0, histogram: 0 };
  
  const ema12 = calculateEMA(data.slice(0, 12), 12);
  const ema26 = calculateEMA(data.slice(0, 26), 26);
  const macdLine = ema12 - ema26;
  const signalLine = calculateEMA([{ close_price: macdLine }], 9);
  
  return {
    signal: macdLine,
    histogram: macdLine - signalLine
  };
}

function calculateEMA(data: any[], periods: number) {
  if (data.length === 0) return 0;
  const multiplier = 2 / (periods + 1);
  let ema = data[data.length - 1].close_price;
  
  for (let i = data.length - 2; i >= 0; i--) {
    ema = (data[i].close_price * multiplier) + (ema * (1 - multiplier));
  }
  return ema;
}

function analyzeTrend(data: any[]) {
  const recent = data.slice(0, 10);
  const older = data.slice(10, 20);
  
  const recentAvg = recent.reduce((sum, candle) => sum + candle.close_price, 0) / recent.length;
  const olderAvg = older.reduce((sum, candle) => sum + candle.close_price, 0) / older.length;
  
  const change = (recentAvg - olderAvg) / olderAvg;
  
  return {
    direction: change > 0.001 ? 'BULLISH' : change < -0.001 ? 'BEARISH' : 'SIDEWAYS',
    strength: Math.abs(change) * 100
  };
}

function findSupport(data: any[]) {
  const lows = data.map(candle => candle.low_price).sort((a, b) => a - b);
  return lows[Math.floor(lows.length * 0.2)]; // 20th percentile
}

function findResistance(data: any[]) {
  const highs = data.map(candle => candle.high_price).sort((a, b) => b - a);
  return highs[Math.floor(highs.length * 0.2)]; // 20th percentile
}

function calculateNewsSentiment(newsData: any[]) {
  if (!newsData.length) return 0;
  
  const sentimentWords = {
    positive: ['bullish', 'growth', 'strong', 'rise', 'up', 'gain', 'boost', 'recovery'],
    negative: ['bearish', 'fall', 'down', 'decline', 'drop', 'weak', 'concern', 'crisis']
  };
  
  let totalSentiment = 0;
  newsData.forEach(news => {
    const content = (news.title + ' ' + news.content).toLowerCase();
    let sentiment = 0;
    
    sentimentWords.positive.forEach(word => {
      sentiment += (content.match(new RegExp(word, 'g')) || []).length;
    });
    sentimentWords.negative.forEach(word => {
      sentiment -= (content.match(new RegExp(word, 'g')) || []).length;
    });
    
    totalSentiment += sentiment;
  });
  
  return Math.max(-1, Math.min(1, totalSentiment / newsData.length));
}

function calculateVolatility(data: any[]) {
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i-1].close_price - data[i].close_price) / data[i].close_price);
  }
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

function calculateVolumeProfile(data: any[]) {
  const totalVolume = data.reduce((sum, candle) => sum + candle.volume, 0);
  const avgVolume = totalVolume / data.length;
  const currentVolume = data[0].volume;
  
  return currentVolume / avgVolume;
}

function analyzeScalpingConditions(features: any) {
  const { price_action, market_structure, news_sentiment, volatility } = features;
  
  // HRM Scalping Rules
  const ideal_volatility = volatility > 0.002 && volatility < 0.01; // 0.2% to 1%
  const trend_aligned = Math.abs(market_structure.trend_strength) > 0.3;
  const rsi_oversold = price_action.rsi < 30;
  const rsi_overbought = price_action.rsi > 70;
  const macd_bullish = price_action.macd_signal > 0 && price_action.macd_histogram > 0;
  const macd_bearish = price_action.macd_signal < 0 && price_action.macd_histogram < 0;
  const news_positive = news_sentiment > 0.2;
  const news_negative = news_sentiment < -0.2;
  
  let bullish_signal = false;
  let bearish_signal = false;
  let strength = 0.5;
  
  // Bullish conditions
  if (ideal_volatility && (rsi_oversold || macd_bullish) && 
      market_structure.trend_direction === 'BULLISH' && 
      market_structure.support_distance < 0.005) {
    bullish_signal = true;
    strength += 0.2;
    if (news_positive) strength += 0.1;
  }
  
  // Bearish conditions  
  if (ideal_volatility && (rsi_overbought || macd_bearish) && 
      market_structure.trend_direction === 'BEARISH' && 
      market_structure.resistance_distance < 0.005) {
    bearish_signal = true;
    strength += 0.2;
    if (news_negative) strength += 0.1;
  }
  
  return {
    bullish_signal,
    bearish_signal,
    strength: Math.min(0.95, strength),
    volatility_check: ideal_volatility,
    trend_strength: market_structure.trend_strength,
    technical_alignment: trend_aligned
  };
}

async function getOrCreateStrategy(name: string) {
  const { data, error } = await supabase
    .from('trading_strategies')
    .select('id')
    .eq('name', name)
    .single();
    
  if (data) return data.id;
  
  const { data: newStrategy } = await supabase
    .from('trading_strategies')
    .insert({
      name,
      strategy_type: 'AI_SCALPING',
      parameters: { model: 'hrm_scalping_v1' },
      symbols: ['XAUUSD'],
      timeframes: ['M1', 'M5'],
      risk_parameters: { max_risk_per_trade: 0.01 },
      is_active: true
    })
    .select('id')
    .single();
    
  return newStrategy?.id;
}

async function getActiveModel() {
  const { data } = await supabase
    .from('ai_models')
    .select('id')
    .eq('is_active', true)
    .single();
    
  return data?.id;
}

async function getDefaultAccount() {
  const { data } = await supabase
    .from('trading_accounts')
    .select('id')
    .eq('is_active', true)
    .single();
    
  return data?.id;
}