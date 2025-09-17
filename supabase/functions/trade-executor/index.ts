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
    const { action, signalId, accountId } = await req.json();
    
    console.log(`Executing trade action: ${action} for signal: ${signalId}`);
    
    // Get signal details
    const { data: signal, error: signalError } = await supabase
      .from('trade_signals')
      .select('*')
      .eq('id', signalId)
      .single();

    if (signalError || !signal) {
      throw new Error('Signal not found or invalid');
    }

    // Get account details
    const { data: account, error: accountError } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Account not found or invalid');
    }

    // Execute trade based on action
    let result;
    switch (action) {
      case 'EXECUTE_SIGNAL':
        result = await executeSignal(signal, account);
        break;
      case 'CLOSE_POSITION':
        result = await closePosition(req.body.positionId, account);
        break;
      case 'MODIFY_POSITION':
        result = await modifyPosition(req.body.positionId, req.body.modifications, account);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Update signal status
    await supabase
      .from('trade_signals')
      .update({ 
        status: result.success ? 'EXECUTED' : 'FAILED',
        execution_time: new Date().toISOString()
      })
      .eq('id', signalId);

    // Log execution
    await supabase
      .from('trade_journal')
      .insert({
        trade_id: result.tradeId || crypto.randomUUID(),
        account_id: accountId,
        symbol: signal.symbol,
        action: action,
        reason: `Trade execution: ${action}`,
        execution_data: result.executionData,
        trace_id: crypto.randomUUID()
      });

    return new Response(JSON.stringify({
      status: result.success ? 'applied' : 'rejected',
      patch: result.message,
      checks: {
        trade_executed: result.success,
        position_id: result.positionId,
        execution_price: result.executionPrice
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Trade execution error:', error);
    return new Response(JSON.stringify({
      status: 'rejected',
      reason: error.message,
      guidance: ['Check signal validity', 'Verify account balance', 'Review MT5 connection']
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function executeSignal(signal: any, account: any) {
  try {
    // Pre-execution checks
    const preChecks = await performPreExecutionChecks(signal, account);
    if (!preChecks.passed) {
      return {
        success: false,
        message: `Pre-execution check failed: ${preChecks.reason}`,
        executionData: preChecks
      };
    }

    // Calculate final position size based on account balance and risk
    const finalPositionSize = calculatePositionSize(signal, account);
    
    // Execute trade via MT5 bridge
    const executionResult = await executeMT5Trade({
      symbol: signal.symbol,
      action: signal.signal_type === 'BUY' ? 'BUY' : 'SELL',
      volume: finalPositionSize,
      price: signal.entry_price,
      sl: signal.stop_loss,
      tp: signal.take_profit,
      comment: `AI_SIGNAL_${signal.id}`,
      magic: 42 // Deterministic magic number
    });

    if (executionResult.success) {
      // Store position in database
      const { data: position, error } = await supabase
        .from('trading_positions')
        .insert({
          account_id: account.id,
          position_id: executionResult.ticket,
          symbol: signal.symbol,
          type: signal.signal_type,
          volume: finalPositionSize,
          open_price: executionResult.price,
          stop_loss: signal.stop_loss,
          take_profit: signal.take_profit,
          open_time: new Date().toISOString(),
          comment: `AI_SIGNAL_${signal.id}`,
          magic_number: 42
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing position:', error);
      }

      return {
        success: true,
        message: `Trade executed successfully: ${signal.signal_type} ${finalPositionSize} lots at ${executionResult.price}`,
        tradeId: executionResult.ticket,
        positionId: executionResult.ticket,
        executionPrice: executionResult.price,
        executionData: {
          original_signal: signal,
          final_position_size: finalPositionSize,
          execution_time: new Date().toISOString(),
          mt5_response: executionResult
        }
      };
    } else {
      return {
        success: false,
        message: `Trade execution failed: ${executionResult.error}`,
        executionData: executionResult
      };
    }

  } catch (error) {
    console.error('Signal execution error:', error);
    return {
      success: false,
      message: `Execution error: ${error.message}`,
      executionData: { error: error.message }
    };
  }
}

async function performPreExecutionChecks(signal: any, account: any) {
  const checks = {
    passed: true,
    reason: '',
    details: {}
  };

  // Check account balance
  if (account.free_margin < (signal.position_size * signal.entry_price * 0.01)) {
    checks.passed = false;
    checks.reason = 'Insufficient margin';
    return checks;
  }

  // Check signal expiry
  if (signal.expiry_time && new Date(signal.expiry_time) < new Date()) {
    checks.passed = false;
    checks.reason = 'Signal expired';
    return checks;
  }

  // Check confidence threshold
  if (signal.confidence < 0.7) {
    checks.passed = false;
    checks.reason = 'Signal confidence too low';
    return checks;
  }

  // Check market hours (simplified)
  const now = new Date();
  const hour = now.getUTCHours();
  if (hour < 1 || hour > 21) { // Basic market hours check
    checks.passed = false;
    checks.reason = 'Outside market hours';
    return checks;
  }

  // Check for conflicting positions
  const { data: existingPositions } = await supabase
    .from('trading_positions')
    .select('*')
    .eq('account_id', account.id)
    .eq('symbol', signal.symbol)
    .eq('status', 'open');

  if (existingPositions && existingPositions.length >= 3) {
    checks.passed = false;
    checks.reason = 'Too many open positions for symbol';
    return checks;
  }

  checks.details = {
    account_balance: account.balance,
    free_margin: account.free_margin,
    signal_confidence: signal.confidence,
    existing_positions: existingPositions?.length || 0
  };

  return checks;
}

function calculatePositionSize(signal: any, account: any) {
  const riskPerTrade = 0.01; // 1% risk per trade
  const accountRisk = account.balance * riskPerTrade;
  const pipValue = 10; // For XAUUSD, 1 pip = $10 per lot
  const stopLossDistance = Math.abs(signal.entry_price - signal.stop_loss);
  const stopLossPips = stopLossDistance / 0.10; // XAUUSD pip = 0.10
  
  const calculatedSize = accountRisk / (stopLossPips * pipValue);
  const maxSize = Math.min(calculatedSize, 0.1, signal.position_size); // Max 0.1 lots
  
  return Math.max(0.01, Number(maxSize.toFixed(2))); // Min 0.01 lots
}

async function executeMT5Trade(tradeParams: any) {
  try {
    // In production, this would connect to MT5 bridge
    // For now, simulate successful execution
    const simulatedExecution = {
      success: true,
      ticket: `${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      price: tradeParams.price + (Math.random() - 0.5) * 0.20, // Simulate slippage
      volume: tradeParams.volume,
      timestamp: new Date().toISOString()
    };

    // Log the trade attempt
    console.log('MT5 Trade Execution:', {
      params: tradeParams,
      result: simulatedExecution
    });

    return simulatedExecution;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function closePosition(positionId: string, account: any) {
  try {
    // Get position details
    const { data: position } = await supabase
      .from('trading_positions')
      .select('*')
      .eq('position_id', positionId)
      .eq('account_id', account.id)
      .single();

    if (!position) {
      throw new Error('Position not found');
    }

    // Execute close via MT5
    const closeResult = await executeMT5Close({
      ticket: positionId,
      volume: position.volume,
      symbol: position.symbol
    });

    if (closeResult.success) {
      // Update position in database
      await supabase
        .from('trading_positions')
        .update({
          status: 'closed',
          close_price: closeResult.price,
          close_time: new Date().toISOString(),
          profit: closeResult.profit
        })
        .eq('position_id', positionId);
    }

    return {
      success: closeResult.success,
      message: closeResult.success ? 'Position closed successfully' : 'Failed to close position',
      executionPrice: closeResult.price,
      profit: closeResult.profit
    };

  } catch (error) {
    return {
      success: false,
      message: `Close position error: ${error.message}`
    };
  }
}

async function executeMT5Close(closeParams: any) {
  // Simulate position close
  const currentPrice = 2040.50 + (Math.random() - 0.5) * 5;
  const profit = (Math.random() - 0.5) * 200; // Simulate profit/loss
  
  return {
    success: true,
    price: Number(currentPrice.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    timestamp: new Date().toISOString()
  };
}

async function modifyPosition(positionId: string, modifications: any, account: any) {
  try {
    // Get position details
    const { data: position } = await supabase
      .from('trading_positions')
      .select('*')
      .eq('position_id', positionId)
      .eq('account_id', account.id)
      .single();

    if (!position) {
      throw new Error('Position not found');
    }

    // Execute modification via MT5
    const modifyResult = await executeMT5Modify({
      ticket: positionId,
      sl: modifications.stop_loss || position.stop_loss,
      tp: modifications.take_profit || position.take_profit
    });

    if (modifyResult.success) {
      // Update position in database
      await supabase
        .from('trading_positions')
        .update({
          stop_loss: modifications.stop_loss || position.stop_loss,
          take_profit: modifications.take_profit || position.take_profit,
          updated_at: new Date().toISOString()
        })
        .eq('position_id', positionId);
    }

    return {
      success: modifyResult.success,
      message: modifyResult.success ? 'Position modified successfully' : 'Failed to modify position'
    };

  } catch (error) {
    return {
      success: false,
      message: `Modify position error: ${error.message}`
    };
  }
}

async function executeMT5Modify(modifyParams: any) {
  // Simulate position modification
  return {
    success: true,
    timestamp: new Date().toISOString()
  };
}