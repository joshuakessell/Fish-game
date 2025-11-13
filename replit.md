# Ocean King 3 - Casino Betting Table Game

## Overview
This project is a casino-style betting table game, "Ocean King 3," where up to 6 players shoot at exotic fish in a large aquarium. Built with ASP.NET Core 8, SignalR for real-time communication, and Phaser 3 for client-side rendering, it features a fullscreen 1800×900 canvas with responsive scaling and dynamic HTML overlay controls. The game uses parametric path-based fish movement with deterministic client-server synchronization, significantly reducing bandwidth. The core vision is an engaging, fast-paced arcade fishing experience with competitive casino mechanics, targeting a high Return-To-Player (RTP) of 97%, and emphasizing real-time interaction, rich visual effects, and a streamlined fullscreen user experience for the online multiplayer casino game market.

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
    - **Casino Mechanics:** Currently set to 120% RTP for developer testing (production target: 97%). Features dynamic destruction odds and high-volatility payout multipliers.
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