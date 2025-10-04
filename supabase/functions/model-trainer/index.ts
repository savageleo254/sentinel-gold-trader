import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModelWeights {
  sma_fast_weight: number;
  sma_slow_weight: number;
  rsi_overbought_threshold: number;
  rsi_oversold_threshold: number;
  macd_signal_weight: number;
  volume_weight: number;
  trend_weight: number;
  support_resistance_weight: number;
  bias: number;
  learning_rate: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { modelId, symbol = 'XAUUSD', timeframe = '15min', epochs = 50 } = await req.json();

    console.log(`Starting training for model ${modelId} on ${symbol} ${timeframe}`);

    // Fetch historical market data (at least 500 bars for training)
    const { data: marketData, error: marketError } = await supabase
      .from('market_data')
      .select('*')
      .eq('symbol', symbol)
      .eq('timeframe', timeframe)
      .order('timestamp', { ascending: true })
      .limit(1000);

    if (marketError || !marketData || marketData.length < 100) {
      throw new Error(`Insufficient historical data: ${marketData?.length || 0} bars`);
    }

    console.log(`Training with ${marketData.length} historical bars`);

    // Fetch historical positions to learn from actual outcomes
    const { data: positions } = await supabase
      .from('trading_positions')
      .select('*')
      .eq('symbol', symbol)
      .not('profit', 'is', null)
      .order('open_time', { ascending: true });

    // Initialize model weights
    let weights: ModelWeights = {
      sma_fast_weight: 0.5,
      sma_slow_weight: 0.5,
      rsi_overbought_threshold: 70,
      rsi_oversold_threshold: 30,
      macd_signal_weight: 0.5,
      volume_weight: 0.3,
      trend_weight: 0.6,
      support_resistance_weight: 0.4,
      bias: 0.0,
      learning_rate: 0.01,
    };

    // Training metrics
    let totalLoss = 0;
    let trainingAccuracy = 0;
    let correctPredictions = 0;
    let totalPredictions = 0;

    // Training loop - Gradient Descent on historical data
    for (let epoch = 0; epoch < epochs; epoch++) {
      let epochLoss = 0;
      let epochCorrect = 0;

      for (let i = 50; i < marketData.length - 10; i++) {
        const historicalWindow = marketData.slice(i - 50, i);
        const currentBar = marketData[i];
        const futureBar = marketData[i + 10]; // Look ahead 10 bars

        // Calculate technical indicators
        const features = calculateFeatures(historicalWindow, currentBar);
        
        // Predict signal using current weights
        const prediction = predict(features, weights);
        
        // Actual outcome (1 for price increase, 0 for decrease)
        const actual = futureBar.close_price > currentBar.close_price ? 1 : 0;
        
        // Calculate loss (binary cross-entropy)
        const loss = -((actual * Math.log(prediction + 1e-7)) + ((1 - actual) * Math.log(1 - prediction + 1e-7)));
        epochLoss += loss;

        // Update weights using gradient descent
        const error = prediction - actual;
        weights.sma_fast_weight -= weights.learning_rate * error * features.sma_signal;
        weights.sma_slow_weight -= weights.learning_rate * error * features.trend_strength;
        weights.rsi_overbought_threshold += weights.learning_rate * error * 0.1;
        weights.rsi_oversold_threshold -= weights.learning_rate * error * 0.1;
        weights.macd_signal_weight -= weights.learning_rate * error * features.macd_signal;
        weights.volume_weight -= weights.learning_rate * error * features.volume_ratio;
        weights.trend_weight -= weights.learning_rate * error * features.trend_strength;
        weights.support_resistance_weight -= weights.learning_rate * error * features.distance_to_support;
        weights.bias -= weights.learning_rate * error;

        // Check if prediction was correct
        if ((prediction > 0.5 && actual === 1) || (prediction <= 0.5 && actual === 0)) {
          epochCorrect++;
        }
        totalPredictions++;
      }

      const avgEpochLoss = epochLoss / (marketData.length - 60);
      const epochAccuracy = epochCorrect / (marketData.length - 60);
      
      console.log(`Epoch ${epoch + 1}/${epochs} - Loss: ${avgEpochLoss.toFixed(4)}, Accuracy: ${(epochAccuracy * 100).toFixed(2)}%`);
      
      totalLoss = avgEpochLoss;
      trainingAccuracy = epochAccuracy;
      correctPredictions += epochCorrect;

      // Decay learning rate
      weights.learning_rate *= 0.995;
    }

    // Calculate final performance metrics from positions if available
    let winrate = trainingAccuracy;
    let sharpeRatio = 0;
    let maxDrawdown = 0;

    if (positions && positions.length > 0) {
      const profitableTrades = positions.filter(p => p.profit > 0).length;
      winrate = profitableTrades / positions.length;
      
      const returns = positions.map(p => p.profit);
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
      sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) : 0;

      let peak = 0;
      let equity = 0;
      let maxDD = 0;
      for (const pos of positions) {
        equity += pos.profit;
        if (equity > peak) peak = equity;
        const drawdown = peak - equity;
        if (drawdown > maxDD) maxDD = drawdown;
      }
      maxDrawdown = maxDD;
    }

    // Store trained model weights
    const modelHash = generateModelHash(weights);
    const trainingDataHash = generateDataHash(marketData);

    const { error: updateError } = await supabase
      .from('ai_models')
      .update({
        model_hash: modelHash,
        training_data_hash: trainingDataHash,
        parameters: weights,
        performance_metrics: {
          training_loss: totalLoss,
          training_accuracy: trainingAccuracy,
          total_predictions: totalPredictions,
          correct_predictions: correctPredictions,
          training_bars: marketData.length,
          epochs: epochs,
        },
        winrate: winrate,
        sharpe_ratio: sharpeRatio,
        max_drawdown: maxDrawdown,
        updated_at: new Date().toISOString(),
      })
      .eq('id', modelId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Model trained successfully. Winrate: ${(winrate * 100).toFixed(2)}%, Sharpe: ${sharpeRatio.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        modelId,
        metrics: {
          winrate: winrate,
          sharpe_ratio: sharpeRatio,
          max_drawdown: maxDrawdown,
          training_accuracy: trainingAccuracy,
          training_loss: totalLoss,
          training_bars: marketData.length,
          epochs: epochs,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Model training error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateFeatures(historicalWindow: any[], currentBar: any) {
  const closes = historicalWindow.map(b => b.close_price);
  const volumes = historicalWindow.map(b => b.volume);
  const highs = historicalWindow.map(b => b.high_price);
  const lows = historicalWindow.map(b => b.low_price);

  // SMA
  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const sma50 = closes.reduce((a, b) => a + b, 0) / closes.length;
  const sma_signal = (currentBar.close_price - sma20) / sma20;

  // RSI
  let gains = 0, losses = 0;
  for (let i = 1; i < Math.min(14, closes.length); i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  const rs = avgGain / (avgLoss || 1);
  const rsi = 100 - (100 / (1 + rs));

  // MACD
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macd_signal = ema12 - ema26;

  // Volume
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const volume_ratio = currentBar.volume / (avgVolume || 1);

  // Trend
  const trend_strength = (sma20 - sma50) / sma50;

  // Support/Resistance
  const support = Math.min(...lows);
  const resistance = Math.max(...highs);
  const distance_to_support = (currentBar.close_price - support) / support;
  const distance_to_resistance = (resistance - currentBar.close_price) / currentBar.close_price;

  return {
    sma_signal,
    rsi,
    macd_signal,
    volume_ratio,
    trend_strength,
    distance_to_support,
    distance_to_resistance,
  };
}

function calculateEMA(data: number[], period: number): number {
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

function predict(features: any, weights: ModelWeights): number {
  let score = weights.bias;
  
  score += features.sma_signal * weights.sma_fast_weight;
  score += features.trend_strength * weights.trend_weight;
  score += features.macd_signal * weights.macd_signal_weight;
  score += features.volume_ratio * weights.volume_weight;
  score += features.distance_to_support * weights.support_resistance_weight;

  // RSI contribution
  if (features.rsi > weights.rsi_overbought_threshold) {
    score -= 0.5;
  } else if (features.rsi < weights.rsi_oversold_threshold) {
    score += 0.5;
  }

  // Sigmoid activation
  return 1 / (1 + Math.exp(-score));
}

function generateModelHash(weights: ModelWeights): string {
  const str = JSON.stringify(weights);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function generateDataHash(data: any[]): string {
  const str = `${data.length}_${data[0]?.timestamp}_${data[data.length - 1]?.timestamp}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
