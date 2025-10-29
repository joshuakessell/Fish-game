# Ocean King 3 - Multiplayer Fishing Game

## Overview
A real-time multiplayer fishing arcade game supporting up to 8 concurrent players. Built with ASP.NET Core 8, SignalR for real-time communication, and HTML5 Canvas for client-side rendering.

## Recent Changes (October 29, 2025)
- **Fixed critical SignalR event handler leak**: Refactored to use IHub Context directly instead of per-join event subscriptions
- **Fixed fish timing bug**: Fish movement patterns now use consistent tick-based timing (30 TPS)
- Set up authoritative server architecture with 30 TPS game loop
- Implemented core entity systems (Fish, Projectile, Player)
- Built collision detection and payout system
- Created HTML5 Canvas client with fish rendering

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
- **wwwroot/game.js**: Client-side rendering, SignalR connection, input handling

### Key Features
- **Authoritative Server**: All game logic runs server-side at 30 TPS
- **8-Player Support**: Up to 8 simultaneous players per match
- **Real-time Sync**: SignalR broadcasts game state 30 times per second
- **Fish Types**: Small (10 HP), Medium (30 HP), Large (100 HP), Boss (500 HP)
- **Credit Economy**: Players spend credits to shoot, earn credits for kills
- **Payout Multipliers**: Random 1x-10x multipliers on fish kills
- **Movement Patterns**: Fish have different movement styles (straight, sine wave, spiral)
- **Fire Rate Limiting**: Max 10 shots per second per player (server-enforced)

## How to Play
1. Enter your name on the login screen
2. Click "Join Game" to enter a match
3. Click anywhere on the canvas to shoot in that direction
4. Hit fish to damage them and earn credits when they die
5. Switch weapons using the buttons at the bottom (Normal, Lightning, Bomb)

## Technical Details

### Network Protocol
- **JoinMatch**: Player joins a match and gets assigned a slot (0-7)
- **Fire**: Send shooting commands with position and direction
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
