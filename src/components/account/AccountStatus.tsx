import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Wallet, TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TradingAccount {
  id: string;
  account_number: string;
  broker: string;
  balance: number;
  equity: number;
  margin: number;
  free_margin: number;
  margin_level: number;
  is_active: boolean;
}

interface Position {
  id: string;
  symbol: string;
  type: string;
  volume: number;
  open_price: number;
  profit: number;
  status: string;
}

export const AccountStatus = () => {
  const [account, setAccount] = useState<TradingAccount | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [dailyPnL, setDailyPnL] = useState({
    profit: 245.80,
    loss: -89.20,
    net: 156.60,
    trades: 12,
    winRate: 75,
  });

  useEffect(() => {
    const fetchAccountData = async () => {
      // Fetch trading account
      const { data: accountData, error: accountError } = await supabase
        .from('trading_accounts')
        .select('*')
        .eq('is_active', true)
        .limit(1);

      if (accountData && accountData.length > 0) {
        setAccount(accountData[0]);
      }

      // Fetch active positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('trading_positions')
        .select('*')
        .eq('status', 'open')
        .limit(10);

      if (positionsData) {
        setPositions(positionsData);
      }
    };

    fetchAccountData();
    const interval = setInterval(fetchAccountData, 5000);

    return () => clearInterval(interval);
  }, []);

  const getPositionColor = (profit: number) => {
    return profit >= 0 ? "text-buy" : "text-sell";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-r from-buy via-primary to-sell rounded-lg">
          <Wallet className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Account Status</h3>
          <p className="text-xs text-muted-foreground">
            {account ? `${account.broker} - ${account.account_number}` : "Loading..."}
          </p>
        </div>
        <Badge variant="default" className="ml-auto">
          <Activity className="h-3 w-3 mr-1" />
          LIVE
        </Badge>
      </div>

      {account && (
        <div className="space-y-4">
          {/* Account Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(account.balance)}</p>
            </div>
            <div className="p-3 bg-secondary/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Equity</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(account.equity)}</p>
            </div>
            <div className="p-3 bg-secondary/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Free Margin</p>
              <p className="text-sm font-medium text-foreground">{formatCurrency(account.free_margin)}</p>
            </div>
            <div className="p-3 bg-secondary/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Margin Level</p>
              <p className="text-sm font-medium text-foreground">{account.margin_level?.toFixed(2)}%</p>
            </div>
          </div>

          {/* Margin Level Progress */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Margin Level</span>
              <span className="text-foreground">{account.margin_level?.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min((account.margin_level || 0) / 10, 100)} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              Warning at 100% • Stop Out at 50%
            </div>
          </div>

          <Separator />

          {/* Daily P&L */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Today's Performance</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-buy/10 rounded">
                <p className="text-buy font-medium">{formatCurrency(dailyPnL.profit)}</p>
                <p className="text-muted-foreground">Profit</p>
              </div>
              <div className="text-center p-2 bg-sell/10 rounded">
                <p className="text-sell font-medium">{formatCurrency(dailyPnL.loss)}</p>
                <p className="text-muted-foreground">Loss</p>
              </div>
              <div className="text-center p-2 bg-primary/10 rounded">
                <p className={`font-medium ${dailyPnL.net >= 0 ? 'text-buy' : 'text-sell'}`}>
                  {formatCurrency(dailyPnL.net)}
                </p>
                <p className="text-muted-foreground">Net</p>
              </div>
            </div>
            
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-muted-foreground">Trades: {dailyPnL.trades}</span>
              <span className="text-muted-foreground">Win Rate: {dailyPnL.winRate}%</span>
            </div>
          </div>

          {/* Active Positions */}
          {positions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Active Positions</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {positions.slice(0, 3).map((position) => (
                  <div key={position.id} className="flex items-center justify-between p-2 bg-secondary/5 rounded text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {position.symbol}
                      </Badge>
                      <span className={position.type === 'buy' ? 'text-buy' : 'text-sell'}>
                        {position.type.toUpperCase()}
                      </span>
                      <span className="text-muted-foreground">{position.volume}</span>
                    </div>
                    <div className="text-right">
                      <p className={getPositionColor(position.profit || 0)}>
                        {formatCurrency(position.profit || 0)}
                      </p>
                      <p className="text-muted-foreground">{position.open_price?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Actions */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1">
              <DollarSign className="h-3 w-3 mr-1" />
              Deposit
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <TrendingDown className="h-3 w-3 mr-1" />
              Withdraw
            </Button>
          </div>
        </div>
      )}

      {!account && (
        <div className="text-center py-8">
          <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No trading account connected</p>
          <Button size="sm" className="mt-2">
            Connect MT5 Account
          </Button>
        </div>
      )}
    </Card>
  );
};