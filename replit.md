# Ocean King 3 - Casino Betting Table Game

## Overview
A casino-style betting table game where 8 players shoot at exotic fish swimming through a large aquarium window. Built with ASP.NET Core 8, SignalR for real-time communication, and HTML5 Canvas for client-side rendering. The play area mimics a billiards table with shooting turrets positioned at the pocket locations.

## Recent Changes (October 29, 2025)
- **Ocean King 3 Fish Types**: 28 total fish types matching arcade standard (Flying Fish through Golden Dragon King)
- **97% RTP**: Increased return-to-player from 90% to 97% for competitive casino gameplay
- **Turret Selection System**: Players choose their turret position from 8 available slots on join
  - Available turrets glow yellow with pulsing animation
  - Turrets positioned at billiards table corners and sides
  - Turrets are 2.5x larger (80x80 pixels) for better visibility
- **Animated Turrets**: Turrets smoothly rotate to face the direction of each shot fired
- **Lifelike Fish Swimming**: Smooth curved paths with natural speed variation, no erratic bouncing
  - Fish slow down during turns, speed up on straights
  - Natural acceleration and deceleration
  - Exit screen naturally without wall bouncing
- **Seamless Continuous Play**: Removed round transitions, players can join/quit anytime without interruptions
- **Boss Rotation System**: Every 10 minutes, eligible bosses rotate (4 ultra-rare + 5 rare mid-bosses) seamlessly in background
- **Bet Value System**: Replaced weapon selection with bet value controls (10-200 credits per shot) using +/- buttons
- **Compact UI**: Side panels reduced to 20% of original size and repositioned to avoid blocking turrets
- **11 Ultra-Rare Jackpot Bosses**: Types 9-19 with elaborate death sequences and massive payouts (2500-7000 credits)
  - Kaiju Megalodon: Interactive QTE (5 teeth targets), dual sector clear
  - Emperor Kraken: Interactive chest choice (3 options), 8-vortex pull
- **Interactive Kill Sequences**: 2 bosses (Megalodon, Kraken) have player interactions with ±30% hidden payout modifiers
- **Development credits**: Players start with 10,000 credits for testing

## Project Architecture

### Server (C# / ASP.NET Core 8)
- **Program.cs**: Application entry point, configures SignalR and static files
- **Server/GameServerHost.cs**: Main game server coordinator
- **Server/MatchManager.cs**: Manages multiple match instances
- **Server/MatchInstance.cs**: Core game loop running at 30 TPS, handles all game state
- **Server/Entities/**: Fish, Projectile, Player entity classes
- **Server/Managers/**: PlayerManager, FishManager, ProjectileManager, CollisionResolver
- **Hubs/GameHub.cs**: SignalR hub for client-server communication

### Client (HTML5 Canvas + JavaScript)
- **wwwroot/index.html**: Game UI and login screen
- **wwwroot/game.js**: Exotic aquarium rendering with animated fish, turret positions, underwater effects

### Key Features
- **9 Exotic Creatures**:
  - Regular: Clownfish, Angelfish, Octopus, Golden Dragon
  - Special: Sea Turtle, Manta Ray, Giant Jellyfish, Hammerhead Shark, Nautilus
- **Casino Mechanics**: 90% RTP with probability-based destruction, 1x-20x multipliers
- **Billiards Table**: 2:1 aspect ratio, 8 turret positions at pocket locations like pool table
- **Natural Movement**: Fish spawn from 8 directions, move in curved paths, exit freely
- **Group Patterns**: Small fish swim in synchronized formations (blooming, symmetrical, circular)
- **30-50 Fish On-Screen**: Constant action with varied spawn rates by rarity
- **Curved Paths**: Special creatures change direction smoothly (max ~100°) throughout journey
- **Authoritative Server**: All game logic and RNG server-side at 30 TPS

## How to Play
1. Enter your name on the login screen
2. Click "Join Game" to enter a match
3. Adjust your bet value (10-200 credits) using the +/- buttons on the side
4. Click anywhere on the canvas to shoot in that direction
5. Hit fish to damage them and earn credits when they die
6. Higher bet values = higher costs per shot, same destruction odds

## Casino Mechanics

### RTP System
- **Target RTP**: 90% over weekly/monthly periods
- **Destruction Odds**: Calculated dynamically using formula `P = 0.90 / (BaseValue × AvgMultiplier)`
  - Small fish (5 credits): ~10.9% destruction chance per hit
  - Medium fish (15 credits): ~3.6% destruction chance per hit
  - Large fish (50 credits): ~1.1% destruction chance per hit
  - Boss fish (500 credits): ~0.11% destruction chance per hit
- **Multipliers**: High-volatility system (1x=70%, 2x=15%, 3x=8%, 5x=5%, 10x=1.5%, 20x=0.5%)
- **Hot Seat**: Purely visual excitement - rotates randomly but doesn't affect actual odds

### Network Protocol
- **JoinMatch**: Player joins match and gets assigned turret slot (0-7)
- **Fire**: Send shooting commands from turret position
- **SetBetValue**: Update bet value for shots (10-200 credits)
- **StateDelta**: Server broadcasts game state every tick (30 times/sec)

### Performance Optimizations
- Single-threaded game loop per match (avoids race conditions)
- Spatial collision detection (simple distance checks)
- Fire-and-forget state broadcasting
- Thread-safe command queue for player inputs

### Scaling Considerations
- Currently uses in-memory state (no database)
- Each match runs independently
- Empty matches auto-cleanup after 60 seconds
- Can run multiple matches concurrently

## User Preferences
- Language: C#
- Framework: ASP.NET Core 8 with SignalR
- Target: Web-based multiplayer game playable online
- Player Count: Support for 8 concurrent players (updated from initial 6)

## Next Steps (Optional Enhancements)
- Special weapons (Lightning Chain, Bomb with AoE)
- Bonus events (Crazy Crab Wave, Golden Dragon Boss)
- Visual effects and animations
- Sound effects
- Performance optimizations (object pooling, binary serialization)
- Spatial partitioning for larger fish counts
