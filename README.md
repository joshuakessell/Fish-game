# Ocean King 3 - Multiplayer Fishing Arcade Game

A real-time multiplayer arcade-style fishing casino game built with **ASP.NET Core 8**, **SignalR**, **Phaser 3**, and **TypeScript**. Up to 6 players simultaneously shoot at exotic fish swimming along parametric Phaser.Curves paths in a shared aquarium, competing for payouts with a 97% RTP casino system.

---

## 🎮 Overview

Ocean King 3 is a casino-style betting table game where players use credits to shoot at fish in a large virtual aquarium. The game features server-authoritative gameplay, deterministic client-server synchronization via parametric path generation, and sophisticated RTP mechanics with progressive boss kills and hidden hot seats.

### Key Features

- ✅ **6-Player Multiplayer** - Real-time gameplay via SignalR with MessagePack protocol
- ✅ **8 Animated Fish Types** - Spritesheet-based swim animations with death effects
- ✅ **Parametric Path Movement** - Server-generated Phaser.Curves paths for smooth, bandwidth-efficient fish movement
- ✅ **Path Validation System** - Strict off-screen spawn/despawn enforcement with multi-layered validation
- ✅ **Server-Authoritative** - All game logic, RNG, collision detection, and payouts calculated server-side
- ✅ **97% RTP Casino Mechanics** - Progressive boss kills, hot seats, and inverse risk/reward curves
- ✅ **Advanced Shooting** - Homing bullets (3.0 rad/s turn rate), double-tap lock-on, auto-targeting with visual crosshair
- ✅ **Fish Formations** - Follow-the-leader schooling with time-staggered spawning and spatial separation
- ✅ **Transaction Ledger** - Paginated history with grouped shot entries and real-time balance display
- ✅ **Bet System** - Adjustable bet values (10-200 credits) with UI interaction protection
- ✅ **Guest Authentication** - JWT-based stateless auth with 1000 starting credits
- ✅ **Lobby System** - Modern 2x2 grid layout with room browsing and seat selection
- ✅ **Mobile Optimized** - Landscape orientation requirement with rotation prompts and swipe-to-start
- ✅ **Comprehensive Testing** - 160+ C# backend tests (74.46% coverage), 47 TypeScript tests (100% passing)

---

## 🛠️ Technology Stack

### Backend
- **ASP.NET Core 8** - Web framework and REST API
- **SignalR** - Real-time WebSocket communication with MessagePack serialization
- **JWT Authentication** - Stateless token-based guest sessions
- **30 TPS Game Loop** - Single-threaded game loop per match with spatial collision detection
- **xUnit + Moq + FluentAssertions** - Comprehensive test suite with 74.46% code coverage

### Frontend
- **Phaser 3** - HTML5 game framework for rendering and animations
- **TypeScript** - Type-safe client-side game logic
- **Vite** - Fast development server with dual proxy configuration (SignalR + REST)
- **Vitest** - Unit testing framework with 47/47 tests passing (100%)
- **Responsive Canvas** - 1800×900 coordinate space with 2:1 aspect ratio scaling

### Development Tools
- **Prettier + ESLint** - Code formatting and linting
- **Node.js 20** - Package management and build tooling
- **.NET 8 SDK** - Backend compilation and testing

---

## 📁 Project Structure

```
OceanKing/
├── Server/                          # C# Backend
│   ├── Controllers/
│   │   └── AuthController.cs       # JWT authentication endpoints
│   ├── Managers/
│   │   ├── LobbyManager.cs         # Room management and pagination
│   │   ├── MatchManager.cs         # Match orchestration
│   │   ├── FishManager.cs          # Fish spawning and lifecycle
│   │   └── PlayerManager.cs        # Player state management
│   ├── Systems/
│   │   ├── Paths/
│   │   │   ├── PathGenerator.cs    # Phaser.Curves path generation
│   │   │   └── SeededRandom.cs     # Deterministic RNG
│   │   └── Collision/              # Spatial collision detection
│   ├── Models/
│   │   ├── Fish.cs                 # Fish entity with Phaser.Curves path data
│   │   ├── PathData.cs             # Serializable path definitions (Linear, Sine, Bezier, Parabola)
│   │   ├── Projectile.cs           # Homing bullet entity
│   │   └── GameState.cs            # Match state container
│   ├── Data/
│   │   └── FishCatalog.cs          # 8 fish type definitions with RTP parameters
│   └── Hubs/
│       └── GameHub.cs              # SignalR hub with StateDelta broadcasting
├── src/                             # TypeScript Frontend (Phaser 3)
│   ├── scenes/
│   │   ├── BootScene.ts            # Asset loading with progress bar
│   │   ├── LobbyScene.ts           # Room selection UI (2x2 grid)
│   │   ├── GameScene.ts            # Main game rendering
│   │   └── UIScene.ts              # Overlay controls (bet buttons, bank display)
│   ├── systems/
│   │   ├── GameState.ts            # Singleton state manager with SignalR connection
│   │   ├── FishSpriteManager.ts    # Fish sprite lifecycle tracking
│   │   ├── paths/
│   │   │   ├── PathComputer.ts     # Phaser.Curves path rendering
│   │   │   └── PathData.ts         # Path type definitions
│   │   └── managers/
│   │       ├── RewardAnimationManager.ts  # Death animations, coins, payout text
│   │       └── TransactionLedger.ts       # Client-side transaction tracking
│   └── main.ts                     # Phaser game initialization
├── Tests/                           # Test Suite
│   ├── Unit/                        # 160+ C# unit tests
│   │   ├── Mechanics/               # RTP, capture probability, boss progression
│   │   ├── Paths/                   # Path generation and validation
│   │   └── Collision/               # Collision detection
│   ├── Integration/                 # MatchInstance, SignalR hub tests
│   ├── RTPBot/                      # Automated RTP validation bot
│   │   └── README.md                # Bot testing documentation
│   └── Frontend/                    # 47 TypeScript tests (Vitest)
├── public/
│   └── assets/
│       ├── spritesheets/fish/       # 8 animated fish spritesheets (8 frames each)
│       ├── fish/                    # Fallback static fish images
│       └── ocean-attack-logo.png    # Loading screen logo
├── OceanKing.csproj                 # C# project file
├── Program.cs                       # ASP.NET startup configuration
├── vite.config.ts                   # Vite dev server with SignalR proxy
├── vitest.config.ts                 # TypeScript test configuration
└── replit.md                        # Technical architecture documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **.NET 8 SDK** or later
- **Node.js 20** or later
- Modern web browser with WebSocket support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd OceanKing
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Restore backend dependencies**
   ```bash
   dotnet restore
   ```

4. **Run the application**
   
   **Backend** (Terminal 1):
   ```bash
   dotnet run --project OceanKing.csproj --urls=http://0.0.0.0:8080
   ```
   
   **Frontend** (Terminal 2):
   ```bash
   npm run dev
   ```

5. **Access the game**
   Open your browser to `http://localhost:5000`

### Quick Start (Replit)

If running on Replit, both workflows are pre-configured:
1. Click "Run" to start both C# Backend and Phaser Frontend
2. Open the webview to play
3. Environment variables and database are auto-configured

---

## 🎮 How to Play

### Lobby Flow

1. **Auto-Login** - Game assigns a guest name (Player####) and 1000 credits automatically
2. **Room Selection** - Browse available rooms in 2×2 grid with pagination
3. **Seat Selection** - Choose from 6 turret positions (0-5)
4. **Start Playing** - Game begins immediately after joining

### Game Controls

- **Click/Tap** - Fire projectiles at fish
- **Double-Tap Fish** - Activate auto-fire lock-on (tap anywhere else to cancel)
- **Auto-Targeting** - Type-specific targeting with visual crosshair
- **Bet Controls** - `+` and `-` buttons to adjust bet value (10-200 credits)
- **Bank Display** - Click to view paginated transaction ledger

### Fish Types & Values

| Type ID | Name | Size | Payout Multiplier | Capture Rate | Spawn Rate |
|---------|------|------|-------------------|--------------|------------|
| 0 | Clownfish | Small | 7x | 60% | 25% |
| 1 | Neon Tetra | Small | 6x | 32% | 34% |
| 2 | Butterflyfish | Small | 5x | 22% | 34% |
| 6 | Lionfish | Medium | 18x | 12% | 17% |
| 9 | Triggerfish | Medium | 16x | 10% | 16% |
| 12 | Hammerhead Shark | Large | 43x | 4% | 9% |
| 14 | Giant Manta Ray | Large | 56x | 3% | 5% |
| 21 | Wave Rider (Bonus) | Special | 35x | 15% | Always 1 active |

---

## 🏗️ Architecture

### Client-Server Model

The game uses a **server-authoritative** architecture where all game logic, physics, and RNG occur on the server. Clients render the game state and send input commands.

```
┌─────────────────────────────┐          ┌──────────────────────────────┐
│  Client (Phaser 3 + TS)     │          │  Server (ASP.NET Core 8)     │
├─────────────────────────────┤          ├──────────────────────────────┤
│ • Canvas Rendering          │◄────────►│ • 30 TPS Game Loop           │
│ • User Input Handling       │ SignalR  │ • Physics & Collision        │
│ • Phaser.Curves Rendering   │ (WSS)    │ • Fish Spawning (Weighted)   │
│ • State Interpolation       │          │ • Projectile Validation      │
│ • Animation Playback        │          │ • Payout Calculation (RTP)   │
│ • Transaction Ledger        │          │ • StateDelta Broadcasting    │
└─────────────────────────────┘          └──────────────────────────────┘
```

### Parametric Path System

Fish movement uses **Phaser.Curves** for smooth, deterministic client-server synchronization:

1. **Server**: Generates path using `SeededRandom` and creates `PathData` (Linear, Sine, Bezier, Parabola)
2. **Server**: Validates endpoints are off-screen (X: ≤-10/≥1810, Y: ≤-10/≥910) with multi-layered validation
3. **Server**: Broadcasts `PathData` to clients via SignalR
4. **Client**: Constructs identical `Phaser.Curves` path using server-provided control points
5. **Client**: Renders fish position using `curve.getPoint(t)` where `t` is interpolated from server tick

**Benefits:**
- Bandwidth efficiency (send control points once, not positions every frame)
- Perfect synchronization (deterministic RNG ensures identical paths)
- Smooth 60fps rendering on client (interpolation between server ticks)

### Path Validation System

Ensures all fish spawn and despawn **off-screen** with multi-layered enforcement:

1. **IsOffScreen Check** - Requires ≥5px buffer (X: ≤-5/≥1805, Y: ≤-5/≥905)
2. **ValidatePathEndpoints** - Throws `InvalidOperationException` if endpoints are on-screen
3. **Post-Offset Clamping** - After formation offsets, coordinates clamped to ≤-10/≥1810/910
4. **Graceful Exception Handling** - Failed spawns logged and skipped without crashing match

### Game Loop (30 TPS)

Server runs a fixed-timestep loop in `MatchInstance.cs`:

1. **Update Physics** - Move fish along parametric paths, update homing bullets
2. **Check Collisions** - Spatial collision detection with increased hitbox radii (40-85%)
3. **Apply Destruction** - Calculate capture probability with RTP formula
4. **Spawn Fish** - Maintain population using weighted spawning (formations for small fish)
5. **Broadcast State** - Send `StateDelta` snapshots to all clients
6. **Cleanup** - Remove dead entities and expired projectiles

### RTP (Return-to-Player) System

The game targets **97% RTP** through:

- **Dynamic Destruction Odds** - `DestructionOdds = RTP / (BaseValue × 1.74)` where RTP constant is tuned to 3.4
- **Progressive Boss Kills** - Logistic curve increases capture probability with sequential kills
- **Hot Seats** - Hidden per-player luck modifiers for controlled variance
- **Fish vs Boss RTP Split** - ~80% RTP from common fish, ~17% from bosses (requires tuning boss engagement rate)

**Validation:** RTP Bot framework runs automated 10,000+ shot tests to measure convergence (see `Tests/RTPBot/README.md`)

---

## 🧪 Testing

### Backend Tests (C#)

```bash
# Run all tests with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test category
dotnet test --filter "Category=RTP"
```

**Coverage:** 74.46% line coverage across 160+ tests
- Unit tests: RTP mechanics, fish spawning, collision detection, boss progression
- Integration tests: MatchInstance, SignalR communication, game loops
- Uses TaskCompletionSource pattern for async testing (no Thread.Sleep)

### Frontend Tests (TypeScript)

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Coverage report
npm run test:coverage
```

**Coverage:** 47/47 tests passing (100%)
- Path calculations, state management, rendering logic
- Fish sprite lifecycle tracking
- Phaser.Curves path computation

### RTP Validation Bot

Automated C# SignalR client that simulates player behavior:

```bash
cd Tests/RTPBot
dotnet run
```

Runs configurable shot counts (500-10,000+) and measures:
- Actual RTP percentage convergence
- Per-fish-type capture rates
- Boss engagement frequency
- Shot-by-shot telemetry with JSON session logging

---

## 🎨 Visual Features

### Fish Animations

- **Swim Cycles** - 8-frame spritesheet animations at 10fps
- **Death Sequences** - White flash → scale pop → spiral rotation → fade out
- **Orientation** - Horizontal mirroring (`flipX`) with ±75° vertical tilt (prevents upside-down appearance)
- **Special Handling** - Manta Ray (Type 14) uses inverted flipX logic, Wave Rider (Type 21) uses velocity threshold to prevent direction flipping

### Reward Animations

- **Floating Payout Text** - Gold text for own kills, silver for others
- **Coin Arcs** - Bezier curve trajectories from fish to bank display with spinning animation
- **Path-Completed Fish** - Silent fade out (300ms alpha tween) without death effects

### UI/UX Design

- **Fullscreen Canvas** - 100vw×100vh with 2:1 aspect ratio maintained via responsive scaling
- **HTML Overlay Controls** - Bet buttons, bank display, and mode toggles positioned via coordinate projection
- **Mobile Experience** - Portrait rotation prompt → Landscape swipe-to-start → Scroll-locked fullscreen gameplay
- **Transaction Ledger** - Paginated history (10 entries per page) with Previous/Next buttons to fix mobile scroll blocking

---

## 🔧 Configuration

### Server Settings (Program.cs)

```csharp
builder.Services.AddSignalR()
    .AddMessagePackProtocol(); // MessagePack for bandwidth efficiency

builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

### Game Constants

**Client** (`src/systems/GameState.ts`):
```typescript
const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 900;
```

**Server** (`Server/Systems/Paths/PathGenerator.cs`):
```csharp
private const float CANVAS_WIDTH = 1800f;
private const float CANVAS_HEIGHT = 900f;
private const float SPAWN_OFFSET = -10f; // Off-screen spawn buffer
```

**RTP Tuning** (`Server/Managers/FishManager.cs`):
```csharp
private const float RTP_CONSTANT = 3.4f; // Targets 97% RTP (requires boss engagement tuning)
```

---

## 🔐 Security Considerations

### Current Implementation

- **JWT Tokens** - Stateless authentication with embedded credits (30-day expiration)
- **Server Authority** - All game logic runs server-side (zero client trust)
- **Input Validation** - Boundary checks on all client coordinates
- **Path Validation** - Exception-based blocking of invalid fish spawns

### Production Recommendations

1. **HTTPS Only** - Enforce SSL/TLS in production
2. **Rate Limiting** - Prevent abuse of shooting endpoints (e.g., 10 shots/second max)
3. **Token Refresh** - Implement short-lived tokens with refresh flow
4. **Secrets Management** - Use environment variables for JWT keys
5. **WebSocket Security** - Connection limits and flood protection

---

## 🚢 Deployment

### Replit Deployment

1. Click "Deploy" button
2. Select "Autoscale" deployment type (stateless web app)
3. Configure custom domain (optional)
4. Environment secrets auto-copied to production

### Manual Deployment

```bash
# Build frontend
npm run build

# Build backend
dotnet publish -c Release -o ./publish

# Run production server
cd publish
dotnet OceanKing.dll
```

**Environment Variables Required:**
- `JWT_SECRET` - Secret key for token signing

---

## 📊 Current Limitations

- **In-Memory State** - Matches clear on server restart (no persistence)
- **Guest-Only Auth** - No permanent account system
- **8 Fish Types** - Only small/medium/large/bonus fish implemented (no boss fish types 25-28 yet)
- **RTP Tuning** - Current RTP ~80-84% (needs boss engagement optimization to reach 97%)

---

## 🤝 Contributing

Areas for enhancement:

- [ ] Complete boss fish implementation (Types 25-28)
- [ ] Fine-tune RTP constant based on boss engagement data
- [ ] Add sound effects and background music
- [ ] Implement special item effects (Drill Crab, Laser Crab)
- [ ] Persistent database for user accounts and leaderboards
- [ ] Admin dashboard for game management
- [ ] Tournament mode with ranked play

---

## 📄 License

This project is provided as-is for educational and demonstration purposes.

---

## 🙏 Acknowledgments

- Inspired by the classic "Ocean King" arcade fishing games
- Built with Replit's AI-assisted development environment
- Powered by **ASP.NET Core 8**, **SignalR**, and **Phaser 3**

---

**Happy Fishing! 🎣**
