# Ocean King 3 - Casino Betting Table Game

## Overview
This project is "Ocean King 3," a casino-style betting table game where up to 6 players shoot at exotic fish in a large aquarium. Built with ASP.NET Core 8, SignalR for real-time communication, and Phaser 3 for client-side rendering, it targets a high Return-To-Player (RTP) of 97%. The game emphasizes real-time interaction, rich visual effects, and a streamlined fullscreen user experience for the online multiplayer casino game market, featuring responsive scaling and dynamic HTML overlay controls. It utilizes parametric path-based fish movement with deterministic client-server synchronization to reduce bandwidth.

## User Preferences
- Language: C#
- Framework: ASP.NET Core 8 with SignalR
- Target: Web-based multiplayer game playable online
- Player Count: Support for 6 concurrent players
- Layout: Fullscreen canvas (100vw×100vh) with HTML overlay controls positioned via coordinate projection

## System Architecture
The game employs a client-server architecture, using ASP.NET Core 8 for server-side logic and a Phaser 3 + TypeScript + Vite client for rendering. Deterministic parametric paths for fish movement ensure smooth 60fps gameplay with optimized bandwidth usage.

**UI/UX Decisions:**
- **Layout:** Fullscreen canvas-first arcade experience (100vw × 100vh) with responsive scaling (2:1 aspect ratio) and dynamic HTML overlay controls anchored to turret positions.
- **Player Controls:** Overlay-based UI includes bet controls, credit display, and mode buttons (Target Mode, Auto-Fire), all semi-transparent and scale-aware.
- **Visuals:** Enhanced fish graphics with animations, animating turrets, dynamic feedback like bullet hit flashes, fish death animations, and shockwave effects.
- **Lobby Design:** A modern 2x2 grid layout displaying 4 tables with rectangular visualizations, 6 player slots, gradients, shadows, hover animations, responsive sizing, and pagination.
- **Mobile/Tablet Experience:** Requires landscape orientation with a portrait mode rotation prompt.

**Technical Implementations:**
- **Server-Side:**
    - **Authentication:** JWT-based stateless authentication for guest sessions with embedded credits.
    - **Lobby System:** Manages rooms, pagination, and auto-creation of new rooms.
    - **Game Loop:** A 30 TPS core game loop manages state, physics, and collisions.
    - **Authoritative Server:** Handles all game logic, RNG, fish spawning, projectile validation, and collision resolution.
    - **Fish Catalog:** Defines fish types with properties like payout, capture probability, and movement characteristics.
    - **Casino Mechanics:** Features inverse risk/reward, progressive boss kills with logistic curve odds, and hidden hot seats providing controlled RTP variance.
    - **Homing Bullets:** Server-side projectiles with a 3.0 rad/s turn rate and 320 px/s speed that curve toward targets.
    - **Protocol:** MessagePack configured for SignalR.
- **Client-Side:**
    - **Framework:** Phaser 3 with TypeScript and Vite. Scene architecture includes Boot, Login, Lobby, Game, and UI scenes.
    - **Authentication:** Guest login via REST endpoint, JWT storage, and SignalR connection.
    - **Lobby UI:** Three-screen flow: Login → Lobby → Game, displaying room lists and solo mode options.
    - **Parametric Path System:** Fish movement computed client-side using deterministic path functions (Linear, Sine, Bezier, Circular).
    - **GameState Manager:** Singleton managing game state, SignalR connection, FishPathManager, and Phaser scene coordination.
    - **Deterministic RNG:** SeededRandom class ensures identical random sequences across client and server.
    - **Responsive Design:** Phaser canvas scales while maintaining a 2:1 aspect ratio within an 1800×900 coordinate space.
    - **Real-time Communication:** SignalR with JWT authentication and optimized StateDelta broadcasts.
- **Core Features:**
    - Categorized fish types with unique behaviors and values.
    - Parametric Path-Based Movement for all fish, with client-side prediction and deterministic synchronization.
    - Dynamic Fish Spawning based on weight, including guaranteed special and boss fish.
    - **Fish Schooling System:** Cohesive group formations with type-specific behaviors (rows, diamonds) using a unique groupId system and local movement space for offsets.
    - 6 Turret System with specific positioning.
    - Advanced Shooting with targeting, auto-fire, and server-side homing bullets.
    - **Auto-Targeting:** Type-specific auto-targeting with visual crosshair indicator, intelligent retargeting, and exclusive mode behavior.
    - **Enhanced Fish Visuals:** Larger sprite sizes for better visibility.
    - **Reward Animations:** Comprehensive visual feedback for fish kills including death animations, floating payout text, and arcing spinning coin animations orchestrated via a RewardAnimationManager.
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