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

async function generateTradingSignal(
  marketData: any[],
  newsEvents: any[],
  symbol: string,
  timeframe: string,
  modelId?: string
): Promise<any> {
  if (marketData.length < 50) {
    throw new Error('Insufficient market data for signal generation');
  }

  // Fetch trained model weights
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let modelWeights = null;
  if (modelId) {
    const { data: model } = await supabase
      .from('ai_models')
      .select('parameters, performance_metrics')
      .eq('id', modelId)
      .single();
    
    if (model && model.parameters) {
      modelWeights = model.parameters;
      console.log('Using trained model weights:', modelWeights);
    }
  }

  // Calculate technical indicators
  const latestBar = marketData[marketData.length - 1];
  const closes = marketData.map(d => d.close_price);
  const highs = marketData.map(d => d.high_price);
  const lows = marketData.map(d => d.low_price);
  const volumes = marketData.map(d => d.volume);

  // Technical Analysis
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  
  // Market Structure
  const trend = analyzeTrend(closes);
  const support = findSupport(lows);
  const resistance = findResistance(highs);
  const volatility = calculateVolatility(closes);
  const volumeProfile = calculateVolumeProfile(volumes);

  // News Sentiment
  const newsSentiment = calculateNewsSentiment(newsEvents);

  // Compile features for AI model
  const features = {
    price: latestBar.close_price,
    sma20,
    sma50,
    sma_signal: (latestBar.close_price - sma20) / sma20,
    rsi,
    macd_line: macd.macd,
    macd_signal: macd.signal,
    macd_histogram: macd.histogram,
    trend,
    trend_strength: (sma20 - sma50) / sma50,
    support,
    resistance,
    distance_to_support: (latestBar.close_price - support) / support,
    distance_to_resistance: (resistance - latestBar.close_price) / latestBar.close_price,
    volatility,
    volumeProfile,
    volume_ratio: latestBar.volume / (volumes.reduce((a, b) => a + b, 0) / volumes.length),
    newsSentiment,
    timestamp: latestBar.timestamp,
  };

  // Use trained model for prediction if available
  let confidence = 0.5;
  let signalType = 'HOLD';

  if (modelWeights) {
    // Use trained model weights for prediction
    const prediction = predictWithModel(features, modelWeights);
    confidence = Math.abs(prediction - 0.5) * 2; // Convert to 0-1 scale
    
    if (prediction > 0.6) {
      signalType = 'BUY';
      confidence = (prediction - 0.5) * 2;
    } else if (prediction < 0.4) {
      signalType = 'SELL';
      confidence = (0.5 - prediction) * 2;
    } else {
      signalType = 'HOLD';
      confidence = 0.5;
    }

    console.log(`Model prediction: ${prediction.toFixed(4)}, Signal: ${signalType}, Confidence: ${(confidence * 100).toFixed(2)}%`);
  } else {
    // Fallback to rule-based HRM scalping strategy
    const scalpingSignal = analyzeScalpingConditions(features, latestBar);
    return scalpingSignal;
  }

  // Calculate entry, stop loss, and take profit based on signal
  const atr = volatility;
  let entryPrice = latestBar.close_price;
  let stopLoss = 0;
  let takeProfit = 0;

  if (signalType === 'BUY') {
    entryPrice = latestBar.close_price + (atr * 0.1);
    stopLoss = entryPrice - (atr * 2);
    takeProfit = entryPrice + (atr * 3);
  } else if (signalType === 'SELL') {
    entryPrice = latestBar.close_price - (atr * 0.1);
    stopLoss = entryPrice + (atr * 2);
    takeProfit = entryPrice - (atr * 3);
  }

  // Calculate position size (2% risk per trade)
  const riskAmount = 1000; // Assume $1000 account for now
  const riskPerTrade = riskAmount * 0.02;
  const stopLossDistance = Math.abs(entryPrice - stopLoss);
  const positionSize = stopLossDistance > 0 ? riskPerTrade / stopLossDistance : 0.01;

  return {
    signal_type: signalType,
    confidence: Math.min(Math.max(confidence, 0), 1),
    entry_price: entryPrice,
    stop_loss: stopLoss,
    take_profit: takeProfit,
    position_size: Math.max(0.01, Math.min(positionSize, 1.0)),
    features,
    model_prediction: {
      raw_score: confidence,
      model_id: modelId,
      model_weights_used: modelWeights !== null,
    },
  };
}

function predictWithModel(features: any, weights: any): number {
  let score = weights.bias || 0;
  
  score += (features.sma_signal || 0) * (weights.sma_fast_weight || 0);
  score += (features.trend_strength || 0) * (weights.trend_weight || 0);
  score += (features.macd_histogram || 0) * (weights.macd_signal_weight || 0);
  score += (features.volume_ratio || 0) * (weights.volume_weight || 0);
  score += (features.distance_to_support || 0) * (weights.support_resistance_weight || 0);

  // RSI contribution
  if (features.rsi > (weights.rsi_overbought_threshold || 70)) {
    score -= 0.5;
  } else if (features.rsi < (weights.rsi_oversold_threshold || 30)) {
    score += 0.5;
  }

  // Sigmoid activation
  return 1 / (1 + Math.exp(-score));
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