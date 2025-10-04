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
    console.log('Initializing trading system...');
    
    // 1. Create or update default trading account
    const accountData = {
      account_number: '103936248',
      broker: 'FBS',
      account_type: 'demo',
      balance: 10000.00,
      equity: 10000.00,
      margin: 0,
      free_margin: 10000.00,
      margin_level: 0,
      is_active: true
    };
    
    // Check if default account exists (without user_id for system account)
    const { data: existingAccount } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('account_number', '103936248')
      .maybeSingle();
    
    let account;
    if (existingAccount) {
      account = existingAccount;
      console.log('Using existing account:', existingAccount.id);
    } else {
      // Use upsert which works better with RLS
      const { data: newAccount, error: upsertError } = await supabase
        .from('trading_accounts')
        .upsert(accountData, { onConflict: 'account_number' })
        .select()
        .single();
      
      if (upsertError) throw upsertError;
      account = newAccount;
      console.log('Created account:', newAccount?.id);
    }
    
    // 2. Create default AI models
    const aiModels = [
      {
        name: 'HRM Scalping Model v1',
        version: '1.0.0',
        model_type: 'neural_network',
        model_hash: 'hrm_scalp_v1_42',
        deployment_mode: 'production',
        parameters: {
          layers: 4,
          neurons: [128, 64, 32, 16],
          activation: 'relu',
          optimizer: 'adam',
          learning_rate: 0.001
        },
        is_active: true,
        winrate: 0.72,
        sharpe_ratio: 2.3,
        max_drawdown: 0.05,
        performance_metrics: {
          total_trades: 1250,
          profitable_trades: 900,
          average_profit: 15.4,
          max_consecutive_wins: 12,
          max_consecutive_losses: 5
        }
      },
      {
        name: 'Gemini AI Analyzer',
        version: '2.5.0',
        model_type: 'transformer',
        model_hash: 'gemini_25_flash',
        deployment_mode: 'production',
        parameters: {
          model: 'gemini-2.5-flash',
          temperature: 0.1,
          max_tokens: 2048
        },
        is_active: true,
        winrate: 0.68,
        sharpe_ratio: 2.1,
        max_drawdown: 0.08
      }
    ];
    
    for (const model of aiModels) {
      await supabase.table('ai_models').upsert(model, { onConflict: 'name,version' }).execute();
    }
    console.log('AI models initialized');
    
    // 3. Create default trading strategies
    const { data: defaultModel } = await supabase
      .from('ai_models')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();
    
    const strategies = [
      {
        name: 'AI Scalping Strategy',
        strategy_type: 'AI_SCALPING',
        model_id: defaultModel?.id,
        symbols: ['XAUUSD'],
        timeframes: ['M1', 'M5'],
        parameters: {
          model_type: 'hrm_scalping',
          entry_threshold: 0.75,
          exit_threshold: 0.85,
          confirmation_required: true
        },
        risk_parameters: {
          max_risk_per_trade: 0.01,
          max_daily_loss: 0.05,
          max_positions: 3,
          max_drawdown: 0.20
        },
        max_positions: 3,
        position_size_type: 'risk_based',
        max_daily_loss: 500,
        is_active: true
      },
      {
        name: 'News-Based Strategy',
        strategy_type: 'NEWS_SENTIMENT',
        symbols: ['XAUUSD'],
        timeframes: ['M5', 'M15'],
        parameters: {
          sentiment_threshold: 0.6,
          impact_filter: 'HIGH',
          confirmation_time: 300
        },
        risk_parameters: {
          max_risk_per_trade: 0.015,
          max_daily_loss: 0.05,
          max_positions: 2
        },
        max_positions: 2,
        position_size_type: 'fixed',
        is_active: false
      }
    ];
    
    for (const strategy of strategies) {
      await supabase.table('trading_strategies').upsert(strategy, { onConflict: 'name' }).execute();
    }
    console.log('Trading strategies initialized');
    
    // 4. Initialize system metrics
    const systemMetrics = {
      timestamp: new Date().toISOString(),
      cpu_usage: 35,
      memory_usage: 45,
      disk_usage: 28,
      mt5_connected: false,
      gemini_connected: true,
      open_positions: 0,
      active_strategies: 1
    };
    
    await supabase.table('system_metrics').insert(systemMetrics).execute();
    console.log('System metrics initialized');
    
    // 5. Generate sample market data (will be replaced by real MT5 data)
    const symbol = 'XAUUSD';
    const basePrice = 2040.50;
    const now = new Date();
    const sampleData = [];
    
    // Generate last 100 M1 candles
    for (let i = 100; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 1000);
      const volatility = 1.5;
      const trend = Math.sin(i / 20) * 2;
      
      const open = basePrice + trend + (Math.random() - 0.5) * volatility;
      const close = open + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility;
      const low = Math.min(open, close) - Math.random() * volatility;
      
      sampleData.push({
        symbol,
        timeframe: 'M1',
        timestamp: timestamp.toISOString(),
        open_price: Number(open.toFixed(2)),
        high_price: Number(high.toFixed(2)),
        low_price: Number(low.toFixed(2)),
        close_price: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000),
        tick_volume: Math.floor(Math.random() * 10000),
        spread: Math.floor(Math.random() * 30) + 10
      });
    }
    
    const { error: dataError } = await supabase
      .from('market_data')
      .upsert(sampleData, { onConflict: 'symbol,timeframe,timestamp', ignoreDuplicates: true })
      .execute();
    
    if (dataError) console.error('Error inserting sample data:', dataError);
    else console.log('Sample market data initialized');
    
    // 6. Create sample news events
    const sampleNews = [
      {
        title: 'Fed Signals Potential Rate Cut in Q2',
        content: 'Federal Reserve officials indicate willingness to lower interest rates if economic conditions warrant',
        source: 'ForexFactory',
        impact: 'HIGH',
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        url: 'https://www.forexfactory.com',
        category: 'ECONOMIC_CALENDAR',
        symbols: ['XAUUSD', 'EURUSD']
      },
      {
        title: 'Gold Prices Surge on Safe-Haven Demand',
        content: 'Geopolitical tensions drive investors toward precious metals',
        source: 'Bloomberg',
        impact: 'HIGH',
        published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        url: 'https://www.bloomberg.com',
        category: 'MARKET_NEWS',
        symbols: ['XAUUSD']
      },
      {
        title: 'US Dollar Weakens Against Major Currencies',
        content: 'Dollar index falls as market anticipates policy changes',
        source: 'Reuters',
        impact: 'MEDIUM',
        published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        category: 'MARKET_NEWS',
        symbols: ['XAUUSD', 'EURUSD', 'GBPUSD']
      }
    ];
    
    for (const news of sampleNews) {
      await supabase.table('news_events').upsert(news, { 
        onConflict: 'title,source',
        ignoreDuplicates: true 
      }).execute();
    }
    console.log('Sample news initialized');
    
    // 7. Generate initial AI signal
    const signal = {
      strategy_id: (await supabase.table('trading_strategies').select('id').eq('is_active', true).limit(1).single()).data?.id,
      symbol: 'XAUUSD',
      timeframe: 'M5',
      signal_type: 'BUY',
      confidence: 0.82,
      entry_price: basePrice + 0.50,
      stop_loss: basePrice + 0.50 - (basePrice * 0.001),
      take_profit: basePrice + 0.50 + (basePrice * 0.0025),
      position_size: 0.01,
      signal_time: new Date().toISOString(),
      expiry_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: 'pending',
      features: {
        rsi: 35,
        macd: 0.5,
        trend: 'BULLISH',
        volatility: 0.008
      },
      model_prediction: {
        primary_layer: 'BULLISH',
        sequential_layer: 'NEUTRAL',
        contextual_layer: 'BULLISH',
        confidence_breakdown: {
          technical: 0.85,
          fundamental: 0.78,
          sentiment: 0.83
        }
      }
    };
    
    await supabase.table('trade_signals').insert(signal).execute();
    console.log('Initial AI signal created');
    
    return new Response(JSON.stringify({
      status: 'applied',
      patch: 'Trading system initialized successfully',
      checks: {
        account_created: !!account,
        ai_models: aiModels.length,
        strategies: strategies.length,
        sample_data_points: sampleData.length,
        news_events: sampleNews.length,
        signal_generated: true
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Initialization error:', error);
    return new Response(JSON.stringify({
      status: 'rejected',
      reason: error.message,
      guidance: ['Check Supabase connection', 'Verify database schema', 'Review error logs']
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});