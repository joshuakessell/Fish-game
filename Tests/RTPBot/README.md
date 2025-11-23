# Ocean King 3 - RTP Bot Testing Tool

Automated SignalR client that validates the game's Return-to-Player (RTP) mechanics by simulating player behavior and tracking payout statistics.

## Features

- ✅ **Automated Guest Authentication** - Connects and authenticates via JWT
- ✅ **SignalR Integration** - Full MessagePack protocol support
- ✅ **Configurable Shot Count** - Run tests from 100 to 100,000+ shots
- ✅ **Real-Time Statistics** - Tracks wagered, won, RTP%, and per-fish capture rates
- ✅ **Progress Indicators** - Visual feedback during long test runs
- ✅ **Detailed Reporting** - Comprehensive summary with fish kill breakdowns

## Prerequisites

- .NET 8 SDK
- Ocean King backend server running on `http://localhost:8000` (default port)

## Installation

```bash
cd Tests/RTPBot
dotnet restore
```

## Usage

### Basic Test (1000 shots, $10 bet)
```bash
dotnet run
```

### Custom Shot Count
```bash
dotnet run 5000
```

### Custom Bet Value
```bash
dotnet run 5000 50
```

### Custom Server URL
```bash
dotnet run 1000 10 http://yourdomain.com:8000
```

## Command Line Arguments

```
dotnet run [shotCount] [betValue] [serverUrl]
```

| Argument | Default | Description |
|----------|---------|-------------|
| shotCount | 1000 | Number of shots to fire |
| betValue | 10 | Credits to wager per shot (not currently supported by server) |
| serverUrl | http://localhost:8000 | Backend server URL |

## Output

### Sample Output
```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    Ocean King 3 - RTP Bot Testing Tool                    ║
╚═══════════════════════════════════════════════════════════════════════════╝

Configuration:
  Shot Count:  5,000
  Bet Value:   $10
  Server URL:  http://localhost:8000

[RTPBot_142530] Authenticating as guest...
[RTPBot_142530] ✅ Authenticated with 10000 credits
[RTPBot_142530] Connecting to SignalR hub...
[RTPBot_142530] ✅ Connected to SignalR
[RTPBot_142530] Creating solo game...
[RTPBot_142530] ✅ Solo game created successfully
[RTPBot_142530] Starting RTP test: 5000 shots at $10 bet
[RTPBot_142530] Progress: 5% 10% 15% 20% 25% 30% 35% 40% 45% 50% 55% 60% 65% 70% 75% 80% 85% 90% 95% 100% 

================================================================================
RTP BOT TEST RESULTS - RTPBot_142530
================================================================================
Duration:        04:10
Total Shots:     5,000
Total Wagered:   $50,000.00
Total Won:       $42,350.00
Net P/L:         -$7,650.00
RTP:             84.70%
Starting Credits: 1000
Current Credits:  -6650
--------------------------------------------------------------------------------

Fish Kill Statistics:
  Type 00:  287 kills | Avg Payout: $68.29
  Type 01:  156 kills | Avg Payout: $59.23
  Type 02:   89 kills | Avg Payout: $48.76
  Type 06:   42 kills | Avg Payout: $177.38
  Type 09:   31 kills | Avg Payout: $158.06
  Type 12:   18 kills | Avg Payout: $427.22
  Type 14:    9 kills | Avg Payout: $555.56
  Type 21:   24 kills | Avg Payout: $346.67

================================================================================

[RTPBot_142530] Disconnected
✅ RTP test completed successfully!
```

## Statistics Tracked

- **Total Shots**: Number of projectiles fired
- **Total Wagered**: Sum of all bet values
- **Total Won**: Sum of all payouts received
- **Net P/L**: Profit/loss (won - wagered)
- **RTP%**: Return-to-player percentage ((won / wagered) × 100)
- **Fish Kills**: Per-type kill counts and average payouts
- **Duration**: Test execution time

## RTP Validation

The bot helps validate that the game's RTP mechanics converge to the target **97% RTP**:

- **Small samples** (100-1,000 shots): High variance, RTP may be 60-120%
- **Medium samples** (5,000-10,000 shots): Variance reduces, RTP should be 85-110%
- **Large samples** (50,000+ shots): RTP should converge to 95-99% range

### Expected RTP by Sample Size

| Shots | Expected RTP Range | Confidence |
|-------|-------------------|------------|
| 100 | 60-140% | Low |
| 1,000 | 75-125% | Medium |
| 5,000 | 85-110% | High |
| 10,000 | 90-105% | Very High |
| 50,000+ | 95-99% | Near Certain |

## Troubleshooting

### Connection Failed
```
❌ Authentication failed: 404
```
**Solution**: Ensure backend server is running on the specified URL

### SignalR Timeout
```
❌ Connection failed: The server did not respond to the request
```
**Solution**: Check CORS settings in `Program.cs` and ensure MessagePack protocol is enabled

### No Payouts Received
```
RTP: 0.00%
```
**Solution**: Verify fish spawning is working and collision detection is enabled

## Use Cases

### 1. RTP Validation
Run large sample tests to verify RTP convergence:
```bash
dotnet run 50000 10
```

### 2. Fish Spawn Rate Verification
Check per-fish-type kill counts to validate spawn weights:
```bash
dotnet run 10000 10
```

### 3. Performance Testing
Stress test server with rapid fire:
```bash
dotnet run 100000 10
```

### 4. Bet Value Impact
Test different bet values to ensure payouts scale correctly:
```bash
dotnet run 1000 200  # High roller test
dotnet run 1000 10   # Standard test
```

## Technical Details

### Architecture
```
OceanKingBot
├── ConnectAsync()         # Authenticates and connects to SignalR
├── CreateSoloGameAsync()  # Creates solo game instance
├── RunTestAsync()         # Main test loop
├── FireRandomShotAsync()  # Fires shots with direction vectors
└── OnPayoutEvent()        # Tracks payout statistics

BotStatistics
├── TotalShots, Wagered, Won
├── FishKillCounts (per type)
└── CalculateRTP()
```

### SignalR Events
- **Subscribed**: `PayoutEvent` (tracks fish kills and payouts)
- **Ignored**: `StateDelta` (not needed for RTP validation)

### HTTP Endpoints
- **POST** `/api/auth/guest` - Guest authentication with JWT

## Current Status

### ✅ Working Features
- Guest authentication via JWT (1000 starting credits)
- SignalR connection with MessagePack protocol
- Solo game creation via CreateSoloGame hub method
- Shot firing with normalized direction vectors (x, y, directionX, directionY)
- Real-time progress tracking (20 updates per test)
- Fish spawning in solo matches (verified in backend logs)

### ⚠️ Known Limitations
- **0% RTP with random shooting**: Bot fires at completely random coordinates (100-1700, 100-800), resulting in ~0.1% hit chance on fast-moving fish with specific hitboxes
- **Bet value not implemented**: Server Fire method currently doesn't accept betAmount parameter, so all shots use default bet value
- Requires intelligent targeting (StateDelta subscription) to validate RTP mechanics
- Does not validate client-side rendering or animations
- Single bot instance per execution (no multi-bot tests)

## Next Steps

### Priority Enhancements
1. **Intelligent Fish Targeting** - Subscribe to `StateDelta` to track fish positions and fire at actual targets
2. **Hit Detection Validation** - Verify collision detection works with targeted shots
3. **RTP Convergence Testing** - Once targeting works, run 50,000+ shot tests to validate 95-97% RTP

### Future Enhancements
- [ ] Multi-bot concurrent testing
- [ ] Targeted shooting at specific fish types based on value/probability
- [ ] JSON session logging for detailed analysis
- [ ] Graphical RTP convergence plots
- [ ] Automated pass/fail assertions based on target RTP
- [ ] Fish position prediction using parametric path formulas
