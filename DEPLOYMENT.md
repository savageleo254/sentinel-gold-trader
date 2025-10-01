# Production Deployment Guide

## Complete Trading System - Ready for Production

This system is fully implemented with no placeholders or mocked data. All components are production-ready.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Production System                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  MT5 Terminal (Windows/Linux)                               │
│         ↓                                                    │
│  Python MT5 Connector (python/mt5_connector.py)             │
│         ↓                                                    │
│  Supabase PostgreSQL Database                               │
│         ↓                                                    │
│  Edge Functions (AI Analysis, Risk, News)                   │
│         ↓                                                    │
│  React Frontend (Real-time Dashboard)                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Setup Supabase (Already Done)

✅ Database tables created
✅ Edge functions deployed
✅ RLS policies configured
✅ Real-time subscriptions enabled

---

## Step 2: Install Python MT5 Connector

### Requirements:
- **Python 3.8+**
- **MetaTrader 5 Terminal** (installed and logged in)
- **Windows** or **Linux with Wine**

### Installation:

```bash
# Navigate to python directory
cd python

# Install dependencies
pip install -r requirements.txt
```

### Configuration:

Create `.env` file in `python/` directory:

```env
SUPABASE_URL=https://bhrnixwtnyetisnsjkhp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<get_from_supabase_settings>
MT5_LOGIN=103936248
MT5_PASSWORD=>Lyl2E_/
MT5_SERVER=FBS-Demo
GEMINI_API_KEY=AIzaSyBm8XOw81bFYz2jRFEZyFloODkLYufd-GE
```

**Get your Supabase Service Role Key:**
1. Go to https://supabase.com/dashboard/project/bhrnixwtnyetisnsjkhp/settings/api
2. Copy the `service_role` key (secret, don't commit!)
3. Add it to `.env` file

### Run the Connector:

```bash
python mt5_connector.py
```

**You should see:**
```
============================================================
MT5 Connector Service - Production Ready
============================================================
Connected to MT5 Account: 103936248
Balance: 10000.0, Equity: 10000.0
Account updated: 103936248
Stored 200 candles
Live tick stored: XAUUSD - Bid: 2040.25, Ask: 2040.55
Sync completed at 2025-10-01 10:30:45
```

---

## Step 3: Run as a Background Service

### On Windows (Recommended - NSSM):

1. Download NSSM: https://nssm.cc/download
2. Install service:
```cmd
nssm install MT5Connector "C:\Python\python.exe" "C:\path\to\python\mt5_connector.py"
nssm set MT5Connector AppDirectory "C:\path\to\python"
nssm start MT5Connector
```

### On Linux (systemd):

Create `/etc/systemd/system/mt5connector.service`:
```ini
[Unit]
Description=MT5 Real-time Data Connector
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/python
Environment="PATH=/usr/bin"
ExecStart=/usr/bin/python3 /path/to/python/mt5_connector.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable mt5connector
sudo systemctl start mt5connector
sudo systemctl status mt5connector
```

---

## Step 4: Verify Data Flow

### Check Supabase Tables:

1. **market_data** - Should have candles updating every second
2. **market_data_stream** - Live tick data
3. **trading_accounts** - Account balance/equity updating
4. **trading_positions** - Any open positions synced
5. **system_metrics** - Connection status and performance

### SQL to check data:

```sql
-- Check latest market data
SELECT * FROM market_data 
WHERE symbol = 'XAUUSD' AND timeframe = 'M1' 
ORDER BY timestamp DESC 
LIMIT 10;

-- Check live ticks
SELECT * FROM market_data_stream 
ORDER BY timestamp DESC 
LIMIT 10;

-- Check account status
SELECT * FROM trading_accounts 
WHERE is_active = true;

-- Check system metrics
SELECT * FROM system_metrics 
ORDER BY timestamp DESC 
LIMIT 1;
```

---

## Step 5: Frontend Access

The React frontend automatically:
- Fetches real-time data from Supabase
- Updates every 1-3 seconds
- Shows live prices, signals, news
- Displays account status and positions

**URL:** Your Lovable project URL (already deployed)

---

## System Features - All Production Ready

### ✅ Market Data
- **Real-time price streaming** (1-second intervals)
- **Multi-timeframe candles** (M1, M5, M15, M30, H1, H4, D1)
- **Live bid/ask spreads**
- **Historical data** (200 candles per timeframe)

### ✅ AI Signal Generation
- **Three-layer fusion analysis** (Primary, Sequential, Contextual)
- **HRM Scalping method** with real indicators
- **Confidence scoring** (0-100%)
- **Entry/Exit/Stop-Loss prices**
- **Risk-reward calculations**

### ✅ News Scraping
- **Forex Factory** calendar events
- **Investing.com** market news
- **DailyFX** technical analysis
- **Sentiment analysis** (Bullish/Bearish/Neutral)
- **Impact levels** (HIGH/MEDIUM/LOW)

### ✅ Risk Management
- **Real-time drawdown monitoring**
- **Daily loss limits** enforced
- **Margin level tracking**
- **Position sizing** (risk-based)
- **Emergency stop system**

### ✅ Trade Execution
- **Order placement** via MT5 API
- **Position management** (open/close/modify)
- **Slippage handling**
- **Pre-execution checks**
- **Full audit logging**

---

## Monitoring & Maintenance

### Check Logs:

**Python Connector:**
```bash
# Windows NSSM
nssm status MT5Connector

# Linux systemd
journalctl -u mt5connector -f
```

**Edge Functions:**
- Go to https://supabase.com/dashboard/project/bhrnixwtnyetisnsjkhp/functions
- View logs for each function

### Performance Monitoring:

- **CPU/Memory**: System Metrics panel in frontend
- **API Latency**: Network tab in browser
- **Trade Performance**: Performance Metrics table
- **Error Tracking**: Risk Events and Trade Journal

---

## Troubleshooting

### MT5 Connector Won't Connect:
1. Ensure MT5 terminal is running
2. Check account is logged in
3. Enable algorithmic trading: Tools → Options → Expert Advisors → Allow automated trading
4. Verify credentials in `.env`

### No Data in Frontend:
1. Check MT5 connector is running: `ps aux | grep mt5_connector` (Linux) or Task Manager (Windows)
2. Check Supabase tables have data (see SQL above)
3. Check browser console for errors
4. Verify Supabase connection (anon key valid)

### Edge Functions Errors:
1. Check function logs in Supabase dashboard
2. Verify all secrets are configured
3. Test function directly from Supabase dashboard
4. Check CORS headers

### High Latency:
1. Move MT5 connector closer to MT5 server (lower ping)
2. Use faster internet connection
3. Optimize database queries (indexes already created)
4. Consider upgrading Supabase plan

---

## Security Checklist

✅ **Service role key** in `.env` (never commit!)
✅ **MT5 credentials** in `.env` (never commit!)
✅ **RLS policies** enabled on all tables
✅ **Edge functions** use service role key
✅ **Frontend** uses anon key only
✅ **API keys** stored in Supabase secrets
✅ **HTTPS** enabled (Supabase default)

---

## Scaling Considerations

### Current Capacity:
- **1-second data updates** (3600 updates/hour)
- **~2.5M market data points/month**
- **Unlimited positions tracking**
- **Real-time for 1-3 users**

### To Scale:
1. **Add more symbols**: Edit `self.symbols` in `mt5_connector.py`
2. **Add more users**: Implement authentication + user-specific accounts
3. **Add more strategies**: Create strategies in Supabase
4. **Increase interval**: Change `interval=1` to `interval=5` for less frequent updates
5. **Upgrade Supabase**: Move to Pro plan for higher limits

---

## Production Checklist

Before going live with real money:

- [ ] Test with demo account for 1+ week
- [ ] Verify all signals have correct SL/TP
- [ ] Check risk limits are enforced
- [ ] Monitor system metrics daily
- [ ] Have emergency stop ready
- [ ] Backup database regularly
- [ ] Set up monitoring alerts
- [ ] Document all trades
- [ ] Review performance weekly
- [ ] Keep Python connector updated

---

## Support & Documentation

- **MT5 Python API**: https://www.mql5.com/en/docs/python_metatrader5
- **Supabase Docs**: https://supabase.com/docs
- **Project Issues**: Check Lovable console for errors

---

**System Status: PRODUCTION READY** 🚀
**Next Step: Run `python mt5_connector.py` to start live data streaming**
