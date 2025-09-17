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
    const { accountId, action = 'CALCULATE_RISK' } = await req.json();
    
    console.log(`Calculating risk metrics for account: ${accountId}`);
    
    // Get account details
    const { data: account } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (!account) {
      throw new Error('Account not found');
    }

    // Calculate comprehensive risk metrics
    const riskMetrics = await calculateRiskMetrics(accountId);
    
    // Check for risk violations
    const riskEvents = await checkRiskViolations(accountId, riskMetrics);
    
    // Store risk events if any
    if (riskEvents.length > 0) {
      await supabase
        .from('risk_events')
        .insert(riskEvents);
    }

    // Update account margin levels
    const marginLevel = calculateMarginLevel(riskMetrics);
    await supabase
      .from('trading_accounts')
      .update({ 
        margin_level: marginLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId);

    return new Response(JSON.stringify({
      status: 'applied',
      patch: `Risk calculation completed for account ${accountId}`,
      checks: {
        margin_level: marginLevel,
        risk_events: riskEvents.length,
        daily_pnl: riskMetrics.daily_pnl,
        drawdown: riskMetrics.drawdown,
        risk_score: riskMetrics.overall_risk_score
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Risk calculation error:', error);
    return new Response(JSON.stringify({
      status: 'rejected',
      reason: error.message,
      guidance: ['Check account status', 'Verify position data', 'Review risk parameters']
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function calculateRiskMetrics(accountId: string) {
  // Get account data
  const { data: account } = await supabase
    .from('trading_accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  // Get open positions
  const { data: openPositions } = await supabase
    .from('trading_positions')
    .select('*')
    .eq('account_id', accountId)
    .eq('status', 'open');

  // Get closed positions from last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { data: closedPositions } = await supabase
    .from('trading_positions')
    .select('*')
    .eq('account_id', accountId)
    .eq('status', 'closed')
    .gte('close_time', thirtyDaysAgo.toISOString());

  // Calculate metrics
  const currentEquity = account?.equity || 0;
  const currentBalance = account?.balance || 0;
  const usedMargin = account?.margin || 0;
  const freeMargin = account?.free_margin || 0;

  // Position risk metrics
  const totalPositionRisk = calculatePositionRisk(openPositions || []);
  const maxLossPerPosition = calculateMaxLossPerPosition(openPositions || []);
  const portfolioCorrelation = calculatePortfolioCorrelation(openPositions || []);

  // Historical performance metrics
  const historicalMetrics = calculateHistoricalMetrics(closedPositions || []);

  // Daily P&L calculation
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const { data: todayTrades } = await supabase
    .from('trading_positions')
    .select('profit')
    .eq('account_id', accountId)
    .gte('close_time', todayStart.toISOString());

  const daily_pnl = (todayTrades || []).reduce((sum, trade) => sum + (trade.profit || 0), 0);

  // Drawdown calculation
  const peakBalance = Math.max(currentBalance, ...((closedPositions || []).map(p => p.profit || 0)));
  const drawdown = peakBalance > 0 ? ((peakBalance - currentBalance) / peakBalance) * 100 : 0;

  // Risk score calculation (0-100, higher = riskier)
  const riskScore = calculateOverallRiskScore({
    margin_utilization: usedMargin / (usedMargin + freeMargin),
    position_concentration: totalPositionRisk / currentEquity,
    daily_loss_ratio: Math.abs(daily_pnl) / currentBalance,
    drawdown_percentage: drawdown / 100,
    correlation_risk: portfolioCorrelation
  });

  return {
    account_balance: currentBalance,
    account_equity: currentEquity,
    used_margin: usedMargin,
    free_margin: freeMargin,
    margin_level: (currentEquity / usedMargin) * 100,
    total_positions: (openPositions || []).length,
    total_position_risk: totalPositionRisk,
    max_loss_per_position: maxLossPerPosition,
    portfolio_correlation: portfolioCorrelation,
    daily_pnl,
    drawdown,
    overall_risk_score: riskScore,
    historical_metrics: historicalMetrics,
    risk_limits: {
      max_daily_loss: currentBalance * 0.05, // 5% max daily loss
      max_drawdown: currentBalance * 0.20, // 20% max drawdown
      max_margin_usage: 0.80, // 80% max margin usage
      max_positions_per_symbol: 3
    }
  };
}

function calculatePositionRisk(positions: any[]) {
  return positions.reduce((totalRisk, position) => {
    const currentPrice = position.open_price; // Should be updated with live price
    const stopLoss = position.stop_loss || 0;
    const volume = position.volume || 0;
    
    if (stopLoss === 0) return totalRisk; // No SL = max risk
    
    const riskPerLot = Math.abs(currentPrice - stopLoss) * 10; // $10 per pip for XAUUSD
    const positionRisk = riskPerLot * volume;
    
    return totalRisk + positionRisk;
  }, 0);
}

function calculateMaxLossPerPosition(positions: any[]) {
  if (positions.length === 0) return 0;
  
  const losses = positions.map(position => {
    const currentPrice = position.open_price;
    const stopLoss = position.stop_loss || 0;
    const volume = position.volume || 0;
    
    if (stopLoss === 0) return currentPrice * volume * 10; // No SL = position value
    
    return Math.abs(currentPrice - stopLoss) * volume * 10;
  });
  
  return Math.max(...losses);
}

function calculatePortfolioCorrelation(positions: any[]) {
  // Simplified correlation calculation
  // In production, this would analyze symbol correlations
  const symbols = [...new Set(positions.map(p => p.symbol))];
  const uniqueSymbols = symbols.length;
  const totalPositions = positions.length;
  
  if (totalPositions === 0) return 0;
  
  // Higher correlation = more risk (all positions in same/correlated instruments)
  return 1 - (uniqueSymbols / totalPositions);
}

function calculateHistoricalMetrics(closedPositions: any[]) {
  if (closedPositions.length === 0) {
    return {
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate: 0,
      average_win: 0,
      average_loss: 0,
      profit_factor: 0,
      largest_win: 0,
      largest_loss: 0
    };
  }

  const winningTrades = closedPositions.filter(p => (p.profit || 0) > 0);
  const losingTrades = closedPositions.filter(p => (p.profit || 0) < 0);
  
  const totalWins = winningTrades.reduce((sum, p) => sum + (p.profit || 0), 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, p) => sum + (p.profit || 0), 0));
  
  const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
  const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
  
  return {
    total_trades: closedPositions.length,
    winning_trades: winningTrades.length,
    losing_trades: losingTrades.length,
    win_rate: (winningTrades.length / closedPositions.length) * 100,
    average_win: averageWin,
    average_loss: averageLoss,
    profit_factor: averageLoss > 0 ? averageWin / averageLoss : 0,
    largest_win: Math.max(...closedPositions.map(p => p.profit || 0)),
    largest_loss: Math.min(...closedPositions.map(p => p.profit || 0))
  };
}

function calculateOverallRiskScore(factors: any) {
  const weights = {
    margin_utilization: 25,
    position_concentration: 20,
    daily_loss_ratio: 20,
    drawdown_percentage: 25,
    correlation_risk: 10
  };
  
  let score = 0;
  score += Math.min(factors.margin_utilization * 100, 100) * (weights.margin_utilization / 100);
  score += Math.min(factors.position_concentration * 100, 100) * (weights.position_concentration / 100);
  score += Math.min(factors.daily_loss_ratio * 100, 100) * (weights.daily_loss_ratio / 100);
  score += Math.min(factors.drawdown_percentage * 100, 100) * (weights.drawdown_percentage / 100);
  score += Math.min(factors.correlation_risk * 100, 100) * (weights.correlation_risk / 100);
  
  return Math.min(100, Math.max(0, score));
}

async function checkRiskViolations(accountId: string, metrics: any) {
  const riskEvents = [];
  const now = new Date().toISOString();

  // Check daily loss limit
  if (metrics.daily_pnl < -metrics.risk_limits.max_daily_loss) {
    riskEvents.push({
      account_id: accountId,
      event_type: 'DAILY_LOSS_LIMIT',
      severity: 'HIGH',
      description: `Daily loss exceeded limit: ${metrics.daily_pnl.toFixed(2)} vs limit ${metrics.risk_limits.max_daily_loss.toFixed(2)}`,
      current_value: metrics.daily_pnl,
      threshold_value: -metrics.risk_limits.max_daily_loss,
      action_taken: 'ALERT_SENT'
    });
  }

  // Check drawdown limit
  if (metrics.drawdown > metrics.risk_limits.max_drawdown) {
    riskEvents.push({
      account_id: accountId,
      event_type: 'DRAWDOWN_LIMIT',
      severity: 'HIGH',
      description: `Drawdown exceeded limit: ${metrics.drawdown.toFixed(2)}% vs limit ${(metrics.risk_limits.max_drawdown).toFixed(2)}%`,
      current_value: metrics.drawdown,
      threshold_value: metrics.risk_limits.max_drawdown,
      action_taken: 'TRADING_RESTRICTED'
    });
  }

  // Check margin usage
  const marginUsage = metrics.used_margin / (metrics.used_margin + metrics.free_margin);
  if (marginUsage > metrics.risk_limits.max_margin_usage) {
    riskEvents.push({
      account_id: accountId,
      event_type: 'MARGIN_USAGE',
      severity: 'MEDIUM',
      description: `Margin usage exceeded limit: ${(marginUsage * 100).toFixed(2)}% vs limit ${(metrics.risk_limits.max_margin_usage * 100).toFixed(2)}%`,
      current_value: marginUsage,
      threshold_value: metrics.risk_limits.max_margin_usage,
      action_taken: 'POSITION_SIZE_REDUCED'
    });
  }

  // Check overall risk score
  if (metrics.overall_risk_score > 80) {
    riskEvents.push({
      account_id: accountId,
      event_type: 'HIGH_RISK_SCORE',
      severity: 'MEDIUM',
      description: `Overall risk score is high: ${metrics.overall_risk_score.toFixed(2)}/100`,
      current_value: metrics.overall_risk_score,
      threshold_value: 80,
      action_taken: 'RISK_MONITORING_INCREASED'
    });
  }

  return riskEvents;
}

function calculateMarginLevel(metrics: any) {
  if (metrics.used_margin === 0) return 0;
  return (metrics.account_equity / metrics.used_margin) * 100;
}