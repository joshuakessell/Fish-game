# Ocean King 3 - Multiplayer Fishing Casino Game

A real-time multiplayer arcade-style fishing casino game built with ASP.NET Core 8, SignalR, and HTML5 Canvas. Players shoot at exotic fish in a shared aquarium environment, competing for the highest scores and biggest catches.

## 🎮 Overview

Ocean King 3 is a casino-style betting table game where up to 6 players simultaneously shoot at fish in a large virtual aquarium. Players use credits to place bets on each shot, with the goal of catching valuable fish to win multipliers and increase their balance. The game features 29 unique fish types, ranging from common small fish to ultra-rare boss fish with massive payouts.

### Core Features

- **Multiplayer Support**: Up to 6 concurrent players per game room
- **Real-time Gameplay**: Built on SignalR for instant client-server synchronization
- **29 Fish Types**: Diverse catalog including common, rare, special, and boss fish
- **Casino Mechanics**: 97% Return-to-Player (RTP) with high volatility payouts (1x-20x multipliers)
- **Advanced Shooting**: Targeting mode, auto-fire mode, and bouncing projectiles
- **Bet System**: Adjustable bet values from 10 to 200 credits per shot
- **Guest Authentication**: JWT-based stateless auth with 1000 starting credits
- **Lobby System**: Browse multiple rooms, select specific seats, or play solo offline
- **Fullscreen Canvas**: Responsive 1800×900 rendering with HTML overlay controls
- **Mobile Support**: Landscape orientation required with rotation prompt overlay

## 🎯 Project Vision

This project was built to deliver an engaging, fast-paced arcade fishing experience with competitive casino mechanics. The target RTP of 97% ensures fair gameplay while maintaining excitement through high-volatility multipliers. The game emphasizes:

- Real-time multiplayer interaction
- Rich visual effects and animations
- Streamlined fullscreen user experience
- Server-authoritative gameplay to prevent cheating
- Scalable room-based architecture

## 🛠️ Technology Stack

### Backend
- **ASP.NET Core 8**: Web framework and API
- **SignalR**: Real-time WebSocket communication
- **JWT Authentication**: Stateless token-based auth
- **PostgreSQL**: Database for persistent storage (via Replit)
- **JSON Protocol**: SignalR message serialization

### Frontend
- **HTML5 Canvas**: Game rendering (1800×900 coordinate space)
- **Vanilla JavaScript**: Client-side game logic
- **CSS3**: Responsive UI and overlay positioning
- **SignalR Client**: WebSocket connection to game server

### Development Tools
- **Prettier**: Code formatting
- **Node.js**: Package management for frontend tooling

## 📁 Project Structure

```
OceanKing/
├── Server/
│   ├── Controllers/
│   │   └── AuthController.cs          # JWT authentication endpoints
│   ├── Managers/
│   │   ├── LobbyManager.cs            # Room management and pagination
│   │   ├── MatchManager.cs            # Match orchestration
│   │   └── PlayerManager.cs           # Player state management
│   ├── Models/
│   │   ├── Fish.cs                    # Fish entity definition
│   │   ├── Projectile.cs              # Bullet/projectile entity
│   │   ├── Player.cs                  # Player state and turret
│   │   └── GameState.cs               # Match state container
│   ├── Services/
│   │   └── JwtTokenService.cs         # JWT generation and validation
│   ├── Data/
│   │   └── FishCatalog.cs             # 29 fish type definitions
│   ├── MatchInstance.cs               # Core game loop (30 TPS)
│   └── Hubs/
│       └── GameHub.cs                 # SignalR hub for real-time events
├── wwwroot/
│   ├── index.html                     # Main HTML entry point
│   └── game.js                        # Client-side game logic and rendering
├── OceanKing.csproj                   # C# project file
├── Program.cs                         # ASP.NET startup configuration
└── README.md                          # This file
```

## 🚀 Getting Started

### Prerequisites

- .NET 8 SDK or later
- PostgreSQL database (automatically provided in Replit environment)
- Modern web browser with WebSocket support
- Node.js (for Prettier formatting, optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd OceanKing
   ```

2. **Restore dependencies**
   ```bash
   dotnet restore
   ```

3. **Set up environment variables**
   The following secrets are required (automatically configured in Replit):
   - `DATABASE_URL`: PostgreSQL connection string
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`: Database credentials

4. **Run the application**
   ```bash
   dotnet run --project OceanKing.csproj
   ```

5. **Access the game**
   Open your browser to `http://localhost:5000` (or the Replit-provided URL)

### Quick Start (Replit)

If importing into Replit:
1. Import the repository
2. The environment will auto-detect .NET and configure the workflow
3. Click "Run" to start the server on port 5000
4. Open the webview to play

## 🎮 How to Play

### Lobby Flow

1. **Login**: Click "Play as Guest" to create a temporary session with 1000 credits
2. **Room Selection**: Browse available rooms (4 per page with pagination)
3. **Seat Selection**: Choose from 6 available turret positions (0-5)
4. **Start Playing**: Game starts automatically when you join a seat

### Game Controls

- **Mouse Click**: Fire projectiles at fish
- **Targeting Mode**: Lock onto specific fish for precise shots
- **Auto-Fire Mode**: Continuous shooting without clicking
- **Bet Controls**: `+` and `-` buttons to adjust bet value (10-200 credits)
- **Credits Display**: Real-time balance shown near your turret

### Winning Strategy

- Target high-value fish (bosses, special items) for bigger multipliers
- Manage your bet value based on your credit balance
- Use targeting mode for rare, fast-moving fish
- Watch for "Hot Seat" bonuses that temporarily boost your odds

## 🏗️ Architecture

### Client-Server Model

The game follows a **server-authoritative** architecture where all game logic, physics, and RNG occur on the server. Clients are "dumb terminals" that render the game state and send input commands.

```
Client (Browser)                    Server (ASP.NET Core)
├── HTML5 Canvas Rendering          ├── Game Loop (30 TPS)
├── User Input Handling             ├── Physics & Collision Detection
├── SignalR Connection              ├── Fish Spawning (Weight-based RNG)
└── State Interpolation             ├── Projectile Validation
                                    ├── Payout Calculation (97% RTP)
                                    └── State Broadcasting
```

### Game Loop

The server runs a **30 tick-per-second (TPS)** game loop in `MatchInstance.cs`:

1. **Update Physics**: Move all entities (fish, projectiles)
2. **Check Collisions**: Detect bullet-fish intersections
3. **Apply Destruction**: Calculate capture probability and payouts
4. **Spawn Fish**: Maintain fish population using weighted spawning
5. **Broadcast State**: Send game snapshot to all connected clients
6. **Cleanup**: Remove dead entities and expired projectiles

### Authentication Flow

1. Client calls `/api/auth/guest` with name
2. Server generates JWT with embedded `userId`, `name`, `credits`, and `isGuest` claims
3. Client stores token in `localStorage`
4. SignalR connection uses `accessTokenFactory` to attach JWT
5. Server validates JWT on every SignalR method call via `[Authorize]` attribute

### Fish Catalog System

`FishCatalog.cs` defines all 29 fish types with properties:

- **Payout**: Credit value when caught
- **Capture Probability**: Base chance of successful catch (0.0-1.0)
- **Spawn Weight**: Relative frequency in spawning pool
- **Hitbox Radius**: Collision detection size
- **Speed**: Movement velocity
- **Category**: Common, Rare, Special, Boss

Fish are spawned using **weighted random selection** to ensure variety while maintaining rarity tiers.

### RTP (Return-to-Player) System

The game targets **97% RTP** through:

1. **Dynamic Destruction Odds**: Capture probability adjusted by fish value
2. **Payout Multipliers**: Random multipliers (1x-20x) on successful catches
3. **Boss Fish Sequences**: High-value fish with multi-stage destruction
4. **Hot Seat Bonuses**: Temporary luck boosts for individual players

### Room Management

`LobbyManager.cs` handles:

- **Auto-creation**: New rooms spawn when existing ones fill up
- **Pagination**: Display 4 rooms per page
- **Seat Tracking**: Monitor which turret positions are occupied
- **Player Counts**: Real-time seat availability updates

## 🎨 UI/UX Design

### Canvas Layout

- **Resolution**: 1800×900 pure coordinate space
- **Aspect Ratio**: 2:1 (maintained across all screen sizes)
- **Background**: Ocean blue gradient (#001f3f)
- **Scaling**: Responsive viewport with minimum dimensions enforced

### Turret Positions

Six turrets positioned at:
- **Top Row** (y=90): x = 12%, 50%, 88% of canvas width
- **Bottom Row** (y=810): x = 12%, 50%, 88% of canvas width

### HTML Overlay System

All UI controls are HTML elements positioned via **coordinate projection**:

```javascript
// Convert world coordinates (1800×900) to screen pixels
function projectToScreen(worldX, worldY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: rect.left + (worldX / CANVAS_WIDTH) * rect.width,
    y: rect.top + (worldY / CANVAS_HEIGHT) * rect.height
  };
}
```

This ensures controls stay anchored to turrets regardless of screen size or zoom level.

### Visual Effects

- **Bullet Flashes**: Muzzle flash on projectile creation
- **Fish Death Animations**: Fade, spin, shrink effects
- **Shockwaves**: Radial pulses for high-value fish destruction
- **Credit Popups**: Animated payout notifications
- **Boss Sequences**: Multi-stage death animations

### Mobile Experience

- **Orientation Lock**: Landscape mode required
- **Portrait Overlay**: Rotation prompt when in portrait mode
- **Touch Controls**: Full touch support for shooting and bet adjustment
- **Scroll Instruction**: Brief tutorial for mobile users

## 🔧 Configuration

### Server Settings (Program.cs)

```csharp
builder.Services.AddSignalR()
    .AddJsonProtocol(options => {
        options.PayloadSerializerOptions.PropertyNamingPolicy = null;
    });

builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

### JWT Configuration

- **Issuer**: `OceanKing3`
- **Audience**: `OceanKing3Players`
- **Expiration**: 30 days
- **Secret Key**: Configured via environment variable (auto-generated in Replit)

### Game Constants (game.js)

```javascript
const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 900;
const MIN_BET = 10;
const MAX_BET = 200;
const DEFAULT_BET = 50;
const BULLET_LIFETIME = 5000; // 5 seconds
const TARGET_RTP = 0.97; // 97%
```

## 🧪 Testing

### Manual Testing Steps

1. **Guest Login**: Verify 1000 starting credits
2. **Room Join**: Test seat selection and room joining
3. **Shooting**: Fire projectiles and verify hit detection
4. **Bet Adjustment**: Test +/- buttons for bet value changes
5. **Fish Catching**: Confirm credit updates and payout notifications
6. **Multiplayer**: Open multiple browser tabs to test synchronization
7. **Mobile**: Test on mobile device in landscape mode

### Known Limitations

- No persistence: Credits reset on page refresh (session-based)
- In-memory state: Matches clear when server restarts
- No database integration: All state is volatile
- Guest-only auth: No permanent account system

## 📊 Database Schema

Currently, the application uses **in-memory state** without persistent database storage. All game state (matches, players, credits) is stored in RAM and lost on server restart.

**Future Enhancement**: Implement persistent storage for:
- User accounts and authentication
- Credit balances and transaction history
- Leaderboards and statistics
- Match replays and audit logs

## 🔐 Security Considerations

### Current Implementation

- **JWT Tokens**: Stateless authentication with signed tokens
- **Server Authority**: All game logic runs server-side (no client trust)
- **Input Validation**: Boundary checks on all client coordinates
- **CORS**: Configured for cross-origin requests (adjust for production)

### Production Recommendations

1. **HTTPS Only**: Enable SSL/TLS in production
2. **Rate Limiting**: Prevent abuse of shooting/joining endpoints
3. **Token Refresh**: Implement short-lived tokens with refresh flow
4. **Secrets Management**: Use Azure Key Vault or similar for JWT keys
5. **Input Sanitization**: Validate all SignalR method parameters
6. **WebSocket Security**: Implement connection limits and flood protection

## 🚢 Deployment

### Replit Deployment

1. Click "Deploy" button in Replit
2. Select "Autoscale" or "VM" deployment type
3. Configure custom domain (optional)
4. Environment secrets are automatically copied to production

### Manual Deployment

1. **Build for production**
   ```bash
   dotnet publish -c Release -o ./publish
   ```

2. **Set environment variables**
   ```bash
   export DATABASE_URL="your-postgres-url"
   export JWT_SECRET="your-secret-key"
   ```

3. **Run the published application**
   ```bash
   dotnet ./publish/OceanKing.dll
   ```

4. **Configure reverse proxy** (nginx, Caddy) for HTTPS and port 80/443

### Docker Deployment (Future)

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY ./publish .
EXPOSE 5000
ENTRYPOINT ["dotnet", "OceanKing.dll"]
```

## 📝 Development History

### Initial Project Goals (Prompt Summary)

The project was initiated with the following requirements provided to Replit Agent:

1. **Core Concept**: Build an "Ocean King 3" style multiplayer fishing arcade casino game
2. **Player Count**: Support 6 simultaneous online players per game room
3. **Technology**: C# with ASP.NET Core 8 and SignalR for real-time communication
4. **Rendering**: HTML5 Canvas with fullscreen 1800×900 resolution
5. **UI Design**: Canvas overlay controls positioned via coordinate projection
6. **Monetization**: Real money converted to credits with adjustable bet values
7. **RTP Target**: 97% return-to-player with high volatility payouts
8. **Fish Catalog**: 29 unique fish types with catalog-driven spawning system
9. **Mobile Support**: Landscape orientation required for mobile/tablet devices
10. **Authentication**: Guest/login system with modern lobby featuring 2x2 table grid
11. **Solo Mode**: Offline solo play option for testing and practice

### Key Development Milestones

- ✅ Established ASP.NET Core 8 project structure
- ✅ Implemented JWT-based guest authentication system
- ✅ Built SignalR GameHub with real-time event broadcasting
- ✅ Created 30 TPS server-authoritative game loop
- ✅ Designed 29-fish catalog with weighted spawning
- ✅ Developed HTML5 Canvas rendering with responsive scaling
- ✅ Added lobby system with room management and seat selection
- ✅ Implemented bet value system and credit management
- ✅ Built targeting mode and auto-fire shooting mechanics
- ✅ Added visual effects (death animations, shockwaves, popups)
- ✅ Fixed protocol mismatch (MessagePack → JSON)
- ✅ Resolved duplicate function definitions causing initialization errors
- ✅ Formatted codebase with Prettier

### Technical Decisions Made

1. **JSON over MessagePack**: Switched from MessagePack to JSON protocol due to CDN library loading reliability issues
2. **Single-threaded Game Loop**: Simplified concurrency model for easier debugging
3. **In-memory State**: Prioritized scalability and simplicity over persistence
4. **Fire-and-forget Broadcasting**: Optimized real-time performance over guaranteed delivery
5. **Direct Coordinate System**: Client and server both use 0-1800 × 0-900 space without offset transformations
6. **Server Authority**: All RNG, collision detection, and payout calculation server-side to prevent cheating

## 🤝 Contributing

Contributions are welcome! Areas for enhancement:

- [ ] Persistent database integration for user accounts
- [ ] Real money payment gateway (Stripe, PayPal)
- [ ] Advanced fish AI with schooling behavior
- [ ] Power-ups and special abilities
- [ ] Tournament mode with leaderboards
- [ ] Sound effects and background music
- [ ] Admin dashboard for game management
- [ ] Player chat system
- [ ] Achievement and badge system
- [ ] Mobile app wrapper (Capacitor, React Native)

## 📄 License

This project is provided as-is for educational and demonstration purposes.

## 🙏 Acknowledgments

- Inspired by the classic "Ocean King" arcade fishing games
- Built using Replit's AI-assisted development environment
- Powered by ASP.NET Core and SignalR for real-time multiplayer

---

**Happy Fishing! 🎣**
