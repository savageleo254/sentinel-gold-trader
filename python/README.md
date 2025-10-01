# MT5 Python Connector - Production Ready

This Python service connects directly to your MetaTrader 5 terminal and streams real-time data to Supabase.

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd python
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file in the python directory:

```env
SUPABASE_URL=https://bhrnixwtnyetisnsjkhp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MT5_LOGIN=103936248
MT5_PASSWORD=>Lyl2E_/
MT5_SERVER=FBS-Demo
```

### 3. Install MetaTrader 5

Download and install MT5 terminal from your broker (FBS in this case).
Login to your demo/live account.

### 4. Run the Connector

```bash
python mt5_connector.py
```

The connector will:
- Connect to your MT5 terminal
- Stream live price data every second
- Sync account information
- Update open positions
- Store historical candle data for all timeframes
- Monitor system metrics

## Features

✅ **Direct MT5 API Connection** - Uses official MetaTrader5 Python package
✅ **Real-time Data Streaming** - 1-second intervals for scalping
✅ **Multi-Timeframe Support** - M1, M5, M15, M30, H1, H4, D1
✅ **Position Management** - Tracks all open positions
✅ **Account Sync** - Real balance, equity, margin updates
✅ **Auto-Reconnect** - Handles connection drops gracefully
✅ **Production Logging** - Full error tracking and audit logs

## Running as a Service

### On Windows (using NSSM):
```bash
nssm install MT5Connector "C:\Python\python.exe" "C:\path\to\mt5_connector.py"
nssm start MT5Connector
```

### On Linux (using systemd):
Create `/etc/systemd/system/mt5connector.service`:
```ini
[Unit]
Description=MT5 Data Connector
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/python
ExecStart=/usr/bin/python3 mt5_connector.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable mt5connector
sudo systemctl start mt5connector
```

## Troubleshooting

**Connection Failed:**
- Ensure MT5 terminal is running and logged in
- Check MT5_LOGIN, MT5_PASSWORD, MT5_SERVER are correct
- Verify MT5 allows algorithmic trading (Tools → Options → Expert Advisors)

**No Data:**
- Check symbol name is correct (XAUUSD)
- Ensure symbol is in Market Watch
- Verify account has access to the symbol

**Permission Errors:**
- Run with appropriate permissions
- Check Supabase service role key is valid
