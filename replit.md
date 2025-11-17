# Ocean King 3 - Casino Betting Table Game

## Overview
This project is a casino-style betting table game, "Ocean King 3," where up to 6 players shoot at exotic fish in a large aquarium. Built with ASP.NET Core 8, SignalR for real-time communication, and Phaser 3 for client-side rendering, it features a fullscreen 1800×900 canvas with responsive scaling and dynamic HTML overlay controls. The game uses parametric path-based fish movement with deterministic client-server synchronization, significantly reducing bandwidth. The core vision is an engaging, fast-paced arcade fishing experience with competitive casino mechanics, targeting a high Return-To-Player (RTP) of 97%, and emphasizing real-time interaction, rich visual effects, and a streamlined fullscreen user experience for the online multiplayer casino game market.

## Recent Changes (November 17, 2025)
- **Boss Kill PayoutEvents Fix:** Implemented BossFishHash fallback system to ensure boss kills always trigger reward animations. Added early return guard in ProcessBossKillResult (lines 330-333) to prevent double-crediting on intermediate sequence steps. Boss PayoutEvents now use DestroyedFishHashes[0] if available, otherwise fall back to BossFishHash, ensuring consistent visual feedback for all boss kill sequences.
- **Fish Freezing Fix:** Added comprehensive fish removal logic to FishManager.UpdateFish: path completion check (t >= 1.0 && !Loop) for fish with CachedPathData, DespawnTick fallback for fish without CachedPathData, and boundary check as final safety net. Fish no longer freeze at screen edges after path completion.
- **Realistic Swimming Patterns:** Reduced sine wave amplitude by 67% (15-80px → 5-25px, bonus 30-120px → 10-40px) for more natural, subtle fish swimming animations that better match real aquatic movement.
- **Line-Following Fish Formations:** Changed group formations from side-by-side to line-following behavior. Lateral spacing reduced from 50px × groupIndex to minimal random variation (-5 to +5px), longitudinal spacing increased from 20px × groupIndex to 50px × groupIndex. Fish now swim in cohesive lines with natural drift.

## User Preferences
- Language: C#
- Framework: ASP.NET Core 8 with SignalR
- Target: Web-based multiplayer game playable online
- Player Count: Support for 6 concurrent players
- Layout: Fullscreen canvas (100vw×100vh) with HTML overlay controls positioned via coordinate projection

## System Architecture
The game employs a client-server architecture, utilizing ASP.NET Core 8 for server-side logic and a Phaser 3 + TypeScript + Vite client for rendering. Deterministic parametric paths for fish movement ensure smooth 60fps gameplay with optimized bandwidth usage.

**UI/UX Decisions:**
- **Layout:** Fullscreen canvas-first arcade experience (100vw × 100vh) with responsive scaling (2:1 aspect ratio) and dynamic HTML overlay controls anchored to turret positions.
- **Player Controls:** Overlay-based UI includes bet controls, credit display, and mode buttons (Target Mode, Auto-Fire), all semi-transparent and scale-aware.
- **Visuals:** Enhanced fish graphics with animations, animating turrets, and dynamic feedback such as bullet hit flashes, fish death animations, and shockwave effects.
- **Lobby Design:** A modern 2x2 grid layout displaying 4 tables with rectangular visualizations, 6 player slots, gradients, shadows, hover animations, responsive sizing, and pagination. Seat selection with visual feedback is supported.
- **Mobile/Tablet Experience:** Requires landscape orientation with a portrait mode rotation prompt.

**Technical Implementations:**
- **Server-Side:**
    - **Authentication:** JWT-based stateless authentication for guest sessions with embedded credits.
    - **Lobby System:** Manages rooms, pagination, and auto-creation of new rooms. Hub methods are secured.
    - **Game Loop:** A 30 TPS core game loop manages state, physics, and collisions.
    - **Authoritative Server:** Handles all game logic, RNG, fish spawning, projectile validation, and collision resolution.
    - **Fish Catalog:** Defines fish types with properties like payout, capture probability, and movement characteristics.
    - **Casino Mechanics:** Currently set to 105% RTP for developer testing (production target: 97%). Features:
        - **Inverse Risk/Reward:** Regular fish use formula CaptureProbability = 1.0 / (BaseValue × Multiplier) ensuring 100% RTP baseline
        - **Progressive Boss Kills:** BossShotTracker (per-match) tracks cumulative damage to boss fish, using logistic curve to increase kill odds as damage approaches break-even (BaseValue × 1.657)
        - **Hidden Hot Seats:** Match-scoped HotSeatManager randomly assigns subtle multipliers (1.05x-1.15x) to individual players for 30-second periods with 60-second cooldowns, providing controlled +5-15% variance
    - **Homing Bullets:** Server-side projectiles with 3.0 rad/s turn rate and 320 px/s speed curve toward targets for guaranteed hits.
    - **Protocol:** MessagePack configured for SignalR to reduce message size.
- **Client-Side:**
    - **Framework:** Phaser 3 with TypeScript and Vite. Scene architecture includes Boot, Login, Lobby, Game, and UI scenes.
    - **Authentication:** Guest login via REST endpoint, JWT storage, and SignalR connection with accessTokenFactory.
    - **Lobby UI:** Three-screen flow: Login → Lobby → Game, displaying room lists and solo mode options.
    - **Parametric Path System:** Fish movement computed client-side using deterministic path functions (Linear, Sine, Bezier, Circular). Server broadcasts PathData only on spawn.
    - **GameState Manager:** Singleton managing game state, SignalR connection, FishPathManager, and Phaser scene coordination.
    - **Deterministic RNG:** SeededRandom class ensures identical random sequences across client and server.
    - **Responsive Design:** Phaser canvas scales while maintaining a 2:1 aspect ratio within a 1800×900 coordinate space.
    - **Real-time Communication:** SignalR with JWT authentication and optimized StateDelta broadcasts.
- **Core Features:**
    - Categorized fish types with unique behaviors and values.
    - Parametric Path-Based Movement for all fish, with client-side prediction for bandwidth optimization.
    - Deterministic Synchronization ensures consistent fish trajectories across client and server.
    - Dynamic Fish Spawning based on weight, including guaranteed special and boss fish.
    - **Fish Schooling System:** Cohesive group formations with type-specific behaviors:
        - **Clownfish (typeId 0):** Spawn in rows of 3-5 fish with sequential formation offsets
        - **Neon Tetra (typeId 1):** Spawn in small rows of 2-4 fish
        - **Butterflyfish (typeId 2):** Spawn in diamond formations of 4-8 fish with signed indices (0, -3, 3, -1, 1, -5, 5, -2)
        - **Implementation:** Unique groupId system with pre-computed shared base anchor coordinates per group
        - **LOCAL Movement Space:** Formation offsets applied perpendicular (lateral) and parallel (longitudinal) to direction vector
        - **Signed Offsets:** Positive indices push forward, negative trail behind for proper diamond formations
        - **SinePath Synchronization:** Wave oscillations based on shared base anchors for perfect phase alignment
        - **Cache Management:** 450-tick (15-second) lifetime ensures stable formation parameters throughout spawn
        - **Path Randomization:** Enhanced amplitude/frequency ranges (15-80px, 1.5-7Hz) for visual variety
        - **Smooth Exit Behavior:** Loop=false on all paths prevents fish from jumping back at path end
    - 6 Turret System with specific positioning.
    - Advanced Shooting with targeting, auto-fire (4 shots/second at 250ms intervals), and server-side homing bullets.
    - **Auto-Targeting:** Type-specific auto-targeting with visual crosshair indicator that follows targeted fish. Exclusive mode - manual firing exits auto-target. Intelligent retargeting to same-type fish when target is destroyed.
    - **Enhanced Fish Visuals:** Larger sprite sizes - small fish +20%, medium +50%, large +150% for better visibility.
    - **Reward Animations:** When fish are killed, comprehensive visual feedback includes:
        - Fish death animation (white flash, scale pop, fade out)
        - Floating payout text rising and fading (golden +amount for own kills, silver for other players)
        - Spinning coin that arcs from fish to player's bank (golden 32px for own kills, silver 24px for others)
        - Programmatically generated coin graphics with quadratic Bezier path animation
        - All animations orchestrated via RewardAnimationManager with proper timing coordination
    - Bet Value System replacing weapon selection, allowing bet adjustment per shot.
    - Direct Coordinate System (0-1800 × 0-900) for consistent interaction.

**System Design Choices:**
- Single-threaded game loop per match.
- In-memory state for scalability.
- Spatial collision detection.
- Fire-and-forget state broadcasting for real-time updates.

## External Dependencies
**Backend:**
- **ASP.NET Core 8:** Server-side framework.
- **SignalR:** Real-time communication library.

**Frontend:**
- **Phaser 3:** HTML5 game framework.
- **TypeScript:** Type-safe language.
- **Vite:** Fast development server and build tool.
- **@microsoft/signalr:** SignalR client library.