# Ocean King 3 - Casino Betting Table Game

## Overview
A casino-style betting table game where 8 players shoot at exotic fish swimming through a large aquarium window. Built with ASP.NET Core 8, SignalR for real-time communication, and HTML5 Canvas for client-side rendering. The play area mimics a billiards table with shooting turrets positioned at the pocket locations.

## Recent Changes (October 29, 2025)
- **Development credits**: Players start with 10,000 credits for testing
- **5 New Special Creatures**: Added rare medium-high value fish with curved movement patterns:
  - Sea Turtle (25 credits) - slow gentle curves with animated flippers
  - Manta Ray (35 credits) - graceful swooping with wing flaps
  - Giant Jellyfish (30 credits) - pulsing vertical curves with flowing tentacles
  - Hammerhead Shark (40 credits) - predatory curves with distinctive hammer-shaped head
  - Nautilus (28 credits) - spiral movements with chambered shell
- **Varied fish movement**: Fish spawn from 8 directions (horizontal, vertical, diagonal, complex curves)
- **Group patterns**: Small fish travel in synchronized groups with blooming, symmetrical, or circular formations
- **Curved paths**: Special fish change direction smoothly up to 100 degrees across their journey
- **Billiards table layout**: 2:1 aspect ratio (1600x800) with 8 turret positions at pocket locations
- **90% RTP casino mechanics**: Probability-based destruction with high-volatility multipliers (1x-20x)
- **Unbounded fish movement**: Fish swim naturally and exit screen freely like in a real aquarium

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
3. Click anywhere on the canvas to shoot in that direction
4. Hit fish to damage them and earn credits when they die
5. Switch weapons using the buttons at the bottom (Normal, Lightning, Bomb)

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
- **ChangeWeapon**: Switch between weapon types
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
