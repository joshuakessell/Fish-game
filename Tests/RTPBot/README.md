# RTP Bot - Ocean King RTP Validation Testing Framework

## Overview
Automated C# SignalR bot client for testing Return-to-Player (RTP) percentages in Ocean King game server.

## Quick Start

### 1. Build the Bot
```bash
cd Tests/RTPBot
dotnet build
```

### 2. Configure (Optional)
Edit `appsettings.json` to customize:
- **ServerUrl**: Game server URL (default: `http://localhost:8080`)
- **RoomId**: Room to join (default: `match_1`)
- **SeatNumber**: Seat position 0-5 (default: `1`)
- **BetAmount**: Bet per shot in credits (default: `10`)
- **ShotsPerMinute**: Fire rate (default: `60`)
- **DurationMinutes**: Test duration (default: `5`)
- **BotName**: Bot display name (default: `RTPBot`)

### 3. Run the Bot
```bash
dotnet run
```

## Expected Output

### Connection Phase
```
╔═══════════════════════════════════════════════════╗
║      Ocean King RTP Bot - Testing Framework      ║
╚═══════════════════════════════════════════════════╝

📋 Configuration:
   Server URL:      http://localhost:8080
   Room ID:         match_1
   Seat Number:     1
   Bet Amount:      10 credits
   Shots/Minute:    60
   Duration:        5 minutes
   Bot Name:        RTPBot

🔐 Step 1/4: Authenticating...
✅ Authenticated as 'RTPBot' with 10000 credits
🔌 Step 2/4: Connecting to SignalR...
✅ Connected to SignalR GameHub
🚪 Step 3/4: Joining room...
✅ Joined room 'match_1' at seat 1
💰 Step 4/4: Setting bet value...
💰 Bet value set to 10
```

### Testing Phase
```
╔═══════════════════════════════════════════════════╗
║              Bot Session Started                  ║
╚═══════════════════════════════════════════════════╝

🎯 Target: 300 shots over 5 minutes
⏱️  Shot interval: 1000ms (60 shots/min)

📊 [12:34:56] Progress: 150/300 shots (50.0%) | Elapsed: 2.5m | Remaining: 2.5m
   💵 Credits: 9850 (started with 10000) | RTP: 96.50% | Hit Rate: 35.0%
   📈 Total Wagered: 1500 | Total Won: 1448 | Net: -150
```

### Completion Phase
```
╔═══════════════════════════════════════════════════╗
║              Bot Session Completed                ║
╚═══════════════════════════════════════════════════╝

📊 Final Statistics:
   Total Shots Fired:  300
   Hits:               105 (35.0%)
   Misses:             195

   Starting Credits:   10000
   Ending Credits:     9890
   Net Change:         -110

   Total Wagered:      3000
   Total Paid Out:     2890
   RTP (Return to Player): 96.33%

   Session Duration:   5.00 minutes
   Actual Fire Rate:   60.0 shots/minute

💾 Session saved to: session-20251117-123456.json
✅ Bot execution completed successfully!
```

## Output Files

### session-{timestamp}.json
Contains complete telemetry data:
```json
{
  "BotId": "abc123...",
  "StartTime": "2025-11-17T12:34:56Z",
  "EndTime": "2025-11-17T12:39:56Z",
  "StartingCredits": 10000,
  "CurrentCredits": 9890,
  "Shots": [
    {
      "Timestamp": "2025-11-17T12:34:57Z",
      "BetAmount": 10,
      "TargetX": 850.5,
      "TargetY": 450.2,
      "PayoutReceived": 25,
      "FishTypeKilled": null
    }
  ],
  "TotalWagered": 3000,
  "TotalPaidOut": 2890,
  "CurrentRTP": 0.9633,
  "TotalShots": 300,
  "HitCount": 105,
  "HitRate": 0.35
}
```

## Features

### ✅ Implemented
- [x] Guest authentication via REST API
- [x] SignalR connection with JWT authentication
- [x] MessagePack protocol support
- [x] Automatic reconnection handling
- [x] Room joining and seat selection
- [x] Bet value configuration
- [x] Intelligent target selection (fish or random)
- [x] Real-time telemetry capture from StateDelta
- [x] Payout event tracking
- [x] Thread-safe telemetry recording
- [x] Real-time statistics display
- [x] JSON session export
- [x] Graceful shutdown (Ctrl+C support)

### Target Selection Strategy
1. **Fish Targeting**: If fish are available in latest StateDelta, randomly select one and shoot at its coordinates
2. **Random Targeting**: If no fish available, shoot at random coordinates (x: 100-1700, y: 100-800)

## Project Structure
```
Tests/RTPBot/
├── RTPBot.csproj              # Project file with dependencies
├── appsettings.json           # Configuration template
├── Program.cs                 # Console runner (170 lines)
├── RTPBotClient.cs            # Main bot client (377 lines)
├── BotConfig.cs               # Configuration model
└── Models/
    ├── ShotRecord.cs          # Shot telemetry model
    └── BotSession.cs          # Session telemetry model
```

## Dependencies
- `Microsoft.AspNetCore.SignalR.Client` - SignalR client
- `Microsoft.AspNetCore.SignalR.Protocols.MessagePack` - MessagePack protocol
- `Newtonsoft.Json` - JSON serialization
- `Microsoft.Extensions.Configuration` - Configuration support
- `Microsoft.Extensions.Configuration.Json` - JSON configuration

## Troubleshooting

### Connection Failed
- Ensure game server is running on configured ServerUrl
- Check firewall settings
- Verify server accepts WebSocket connections

### Authentication Failed
- Check `/api/auth/guest` endpoint is available
- Verify server is running on port 8080

### Join Room Failed
- Verify room exists or server auto-creates rooms
- Check seat number is valid (0-5)
- Ensure seat is not already occupied

## Advanced Usage

### Custom Configuration via Code
```csharp
var config = new BotConfig
{
    ServerUrl = "http://production-server:8080",
    RoomId = "test_room_001",
    SeatNumber = 2,
    BetAmount = 50,
    ShotsPerMinute = 120,
    DurationMinutes = 10,
    BotName = "HighRollerBot"
};

await using var bot = new RTPBotClient(config);
// ... rest of bot execution
```

### Analyzing Results
```bash
# View all session files
ls -lh session-*.json

# Extract RTP values from all sessions
jq '.CurrentRTP' session-*.json

# Calculate average RTP across all sessions
jq -s 'map(.CurrentRTP) | add / length' session-*.json
```

## Performance Notes
- Default configuration: 300 shots over 5 minutes
- Each shot takes ~1 second at 60 shots/minute
- Telemetry is thread-safe and recorded asynchronously
- SignalR reconnects automatically on connection loss
- Memory usage: ~50MB for 5-minute session
