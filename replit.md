# Ocean King 3 - Casino Betting Table Game

## Overview
A casino-style betting table game where 8 players shoot at exotic fish swimming through a large aquarium window. Built with ASP.NET Core 8, SignalR for real-time communication, and HTML5 Canvas for client-side rendering. The play area mimics a billiards table with shooting turrets positioned at the pocket locations.

## Recent Changes (November 5, 2025)
- **Complete Fish Catalog Overhaul**: Replaced hardcoded fish system with spreadsheet-driven FishCatalog
  - Created FishCatalog.cs with all 29 fish types (0-28) from balanced spreadsheet data
  - Categories: Small Fish (0-5), Medium Fish (6-11), Large Fish (12-16), High-Value Fish (17-20), Special Items (21-24), Boss Fish (25-28)
  - Weight-based spawning: Small fish appear most frequently (25-34%), rare fish at 1-2%
  - "Always 1 active" guarantee: Exactly 1 Special Item and 1 Boss Fish always on screen
  - Each fish has: FishName, PayoutMultiplier, CaptureProbability, SpawnWeight, HitboxRadius, BaseSpeed
  - Removed 200+ lines of hardcoded switch statements, replaced with catalog lookup
  - Fish.CreateFish now uses catalog data for multipliers, probabilities, and behaviors
  - FishManager automatically maintains Special/Boss presence, makes room by removing low-value fish
  - Client rendering updated with all 29 new fish types and category-appropriate visuals
  - Special Items: Drill Crab, Laser Crab, Roulette Crab, Vortex Jelly
  - Boss Fish: Dragon King, Emperor Turtle, Poseidon, Phantom Kraken

## Previous Changes (October 30, 2025)
- **Ultra-Rare Boss Collision Fix**: Bullets now properly hit ultra-rare bosses (types 9-19)
  - Boss fish initialized with correct HitboxRadius from BossCatalog
  - Previously bullets passed through bosses (HitboxRadius was 0)
  - All 11 ultra-rare jackpot bosses now hittable
- **Enhanced Fish Graphics**: Significantly improved visual quality for all 28 fish types
  - Realistic body gradients with highlights and shadows
  - Animated tails that wag during swimming
  - Flowing fins with wave motion
  - Detailed eyes with pupils and highlights
  - Body undulation for lifelike movement
  - Texture details (scales, spots, suckers on octopus)
  - Mouth and gill details
- **Improved Swimming Animations**: More natural and realistic fish movement
  - tailWag: Tail swaying motion synchronized to swimming
  - finWave: Undulating fin movements
  - bodyUndulate: Subtle body flexing during movement
  - Multi-segment undulation data for serpentine fish
  - All animations vary per fish for organic appearance
- **Guaranteed Ultra-Rare Presence**: At least one ultra-rare boss (types 9-19) always on screen
  - When ultra-rare count drops to zero, system immediately spawns replacement
  - If at max capacity (50 fish), removes lowest-value fish to make room
  - Maintains excitement while respecting MAX_FISH_COUNT limit
- **Larger Bouncing Bullets**: Projectiles 2x larger and bounce off screen edges
  - Bullet radius increased from 6 to 12 pixels with enhanced glow effects
  - Bullets ricochet off all four walls instead of disappearing
  - Extended lifetime from 3 seconds to 30 seconds
  - Bullets only disappear when hitting fish or timing out
- **Natural Fish Swimming**: Fish now swim continuously from off-screen to off-screen
  - Fish only despawn when they exit the play area (never mid-screen)
  - Removed arbitrary lifetime limits causing mid-journey disappearances
  - Only exception: fish destroyed by shots show death animation
- **Bet-Scaled Rewards**: Payouts now multiply by bet value for proper casino mechanics
  - Formula: `fishValue × randomMultiplier × betValue`
  - Example: $100 bet on 5× fish with 2× multiplier = 1,000 credits
  - Projectiles snapshot bet value at fire time (immutable across flight)
- **Turret-Centric UI**: All information displayed directly at each turret on canvas
  - Player credits shown beneath turret with glowing gold display
  - Bet value ($10-$200) displayed above turret with clickable +/- buttons
  - Player name positioned above turret
  - All floating windows removed (no HUD clutter)
- **Fish Death Animation**: 0.25 second spinning, shrinking, fading animation when fish are destroyed
  - 2 full rotations while dying
  - Shrinks to 30% of original size
  - Fades to transparent
- **Credit Popup Animation**: 2 second floating credit display when earning kills
  - Font size scales with payout (16px to 48px for jackpots)
  - Floats upward 50 pixels while fading
  - Gold color with black outline and glow effect
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
- **29 Fish Types** (Spreadsheet-Driven Catalog):
  - Small Fish (0-5): Clownfish, Neon Tetra, Butterflyfish, Angelfish, Pufferfish, Wrasse
  - Medium Fish (6-11): Lionfish, Parrotfish, Seahorse, Triggerfish, Grouper, Boxfish
  - Large Fish (12-16): Swordfish, Shark, Manta Ray, Barracuda, Moray Eel
  - High-Value Fish (17-20): Golden Carp, Fire Kirin, Electric Eel, Crimson Whale
  - Special Items (21-24): Drill Crab, Laser Crab, Roulette Crab, Vortex Jelly (Always 1 active)
  - Boss Fish (25-28): Dragon King, Emperor Turtle, Poseidon, Phantom Kraken (Always 1 active)
- **Casino Mechanics**: 97% RTP with probability-based capture, variable payout multipliers
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
