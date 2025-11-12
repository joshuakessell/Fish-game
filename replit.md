# Ocean King 3 - Casino Betting Table Game

## Overview
This project is a casino-style betting table game named "Ocean King 3," where up to 6 players shoot at exotic fish in a large aquarium. It is built with ASP.NET Core 8, SignalR for real-time communication, and **Phaser 3** for client-side rendering. The game features a fullscreen 1800×900 canvas with ocean blue background, responsive scaling that adapts to all screen sizes, and dynamic HTML overlay controls positioned via coordinate projection. Uses **parametric path-based fish movement** with deterministic client-server synchronization for smooth 60fps gameplay with minimal bandwidth (90% reduction via path-only spawns). All UI elements (bet controls, credits display, mode buttons) are rendered as semi-transparent overlays anchored to turret positions with scale-aware positioning. The core business vision is to deliver an engaging, fast-paced arcade fishing experience with competitive casino mechanics, targeting a high Return-To-Player (RTP) of 97%. The game emphasizes real-time interaction, rich visual effects with enhanced animations (bullet flashes, fish death, shockwaves), and a streamlined fullscreen user experience, aiming for a prominent position in the online multiplayer casino game market.

## User Preferences
- Language: C#
- Framework: ASP.NET Core 8 with SignalR
- Target: Web-based multiplayer game playable online
- Player Count: Support for 6 concurrent players
- Layout: Fullscreen canvas (100vw×100vh) with HTML overlay controls positioned via coordinate projection

## System Architecture
The game follows a client-server architecture with ASP.NET Core 8 handling the server-side logic and a **Phaser 3 + TypeScript + Vite** client for rendering. Uses deterministic parametric paths for fish movement to achieve 60fps gameplay with 90% bandwidth reduction.

**UI/UX Decisions:**
- **Layout:** Fullscreen canvas-first arcade experience with overlay controls. The canvas is 100vw × 100vh with responsive scaling (maintains 2:1 aspect ratio) and an ocean blue background (#001f3f). All controls are HTML overlays positioned via coordinate projection with scale-aware positioning and viewport clamping.
- **Player Controls:** Overlay-based UI anchored to turret positions including bet controls (± buttons), credits display (semi-transparent black box with yellow text), and mode buttons (Target Mode and Auto-Fire). Features a clean aesthetic with semi-transparent styling and continuous updates to overlay positions.
- **Visuals:** Enhanced fish graphics with realistic gradients, animated tails, flowing fins, body undulation, and detailed features. Turrets animate to face shot direction.
- **Interaction:** "Targeting Mode" allows players to lock onto specific fish, and "Auto-Fire Mode" provides continuous shooting.
- **Dynamic Feedback:** Includes bullet hit flashes, fish death animations (fade, spin, shrink), shockwave effects for high-value fish, sequential deaths for boss fish, and credit popup animations.
- **Lobby Design:** Modern 2x2 grid layout displaying 4 tables simultaneously with rectangular table visualizations and 6 player slot positions. Features gradients, shadows, hover animations, full-screen lobby with ocean blue background, responsive sizing using vh/vw units, and pagination. Seat selection system allows joining specific seats with visual feedback.
- **Mobile/Tablet Experience:** Landscape orientation required for mobile/tablet, with a portrait mode overlay prompting rotation.

**Technical Implementations:**
- **Server-Side:**
    - **Authentication System:** JWT-based stateless authentication via `JwtTokenService.cs` and `AuthController.cs` for guest sessions with embedded credits (1000).
    - **Lobby System:** `LobbyManager.cs` tracks rooms, implements pagination (4 per page), and auto-creates new rooms. Hub methods are secured with `[Authorize]`.
    - **Game Loop:** A core game loop runs at 30 TPS, managed by `MatchInstance.cs`, handling game state, physics, and collisions.
    - **Authoritative Server:** All game logic, RNG, fish spawning, projectile validation, and collision resolution are server-authoritative.
    - **Fish Catalog:** `FishCatalog.cs` defines 29 fish types with properties like payout, capture probability, spawn weight, hitbox, and speed, supporting categorized fish.
    - **Casino Mechanics:** Implements a 97% RTP system with dynamic destruction odds and high-volatility payout multipliers (1x-20x).
    - **Player Management:** `MatchManager.cs` orchestrates matches; `PlayerManager.cs` handles player states and turret assignments.
    - **MessagePack Protocol:** Configured for SignalR to reduce message size by 30-50%.
- **Client-Side:**
    - **Phaser 3 Framework:** TypeScript game built with Vite (port 5000). Scene architecture: Boot → Login → Lobby → Game → UI scenes.
    - **Authentication Flow:** Guest login via REST endpoint, stores JWT, connects to SignalR with `accessTokenFactory`.
    - **Lobby UI:** Three-screen flow: Login → Lobby → Game. Displays room list with pagination and solo mode.
    - **Parametric Path System:** Fish movement computed client-side using deterministic path functions (Linear, Sine, Bezier, Circular). Server broadcasts PathData once on spawn; client computes positions locally at 30 TPS.
    - **GameState Manager:** Singleton managing game state, SignalR connection, FishPathManager, and Phaser scene coordination.
    - **FishPathManager:** Tracks fish paths, computes positions per frame using PathComputer utility. Synchronized at 30 TPS with server tick rate.
    - **Deterministic RNG:** SeededRandom class using Linear Congruential Generator (LCG) ensures identical random sequences in C# and TypeScript.
    - **Responsive Design:** Phaser canvas scales while maintaining 2:1 aspect ratio (1800×900 coordinate space).
    - **Real-time Communication:** SignalR with JWT authentication. StateDelta broadcasts include PathData only when IsNewSpawn=true for bandwidth optimization.
    - **Boundary Enforcement:** All interactions validated to 1800×900 play area boundaries.
- **Core Features:**
    - 29 Unique Fish Types categorized with specific behaviors and values.
    - **Parametric Path-Based Movement:** Fish follow deterministic paths (Linear/Sine for common fish, Bezier curves for bosses, Circular for special items). PathGenerator assigns path types by FishCategory.
    - **Client-Side Prediction:** Clients compute fish positions locally using PathData sent on spawn. Reduces bandwidth by ~90% (no continuous position broadcasts).
    - **Deterministic Synchronization:** SeededRandom and 30 TPS tick rate ensure identical fish trajectories on client and server.
    - Dynamic Fish Spawning based on weight, with guaranteed special and boss fish.
    - 6 Turret System positioned at 12%, 50%, 88% of canvas width; y=90 (top row), y=810 (bottom row).
    - Advanced Shooting: Targeting and auto-fire modes, larger bullets that bounce and have extended lifetimes.
    - Bet Value System: Replaces weapon selection, allowing bet adjustment per shot (10-200 credits).
    - Direct Coordinate System: Client and server operate in 0-1800 × 0-900 space without offset transformations.

**System Design Choices:**
- Single-threaded game loop per match for simplified concurrency.
- In-memory state for scalability and auto-cleaning matches.
- Spatial collision detection using distance-based checks.
- Fire-and-forget state broadcasting for optimized real-time updates.

## External Dependencies
**Backend:**
- **ASP.NET Core 8:** Server-side framework.
- **SignalR:** Real-time communication library for client-server interactions.

**Frontend:**
- **Phaser 3:** HTML5 game framework for sprite rendering, animations, and scene management.
- **TypeScript:** Type-safe language for client-side code.
- **Vite:** Fast development server and build tool (port 5000).
- **SignalR Client:** @microsoft/signalr for real-time server communication.

## Recent Changes (2025-11-12)
- **Fixed MessagePack client-server mismatch**: Added MessagePackHubProtocol to client SignalR configuration. Server was sending MessagePack data but client was expecting JSON, causing fish IDs to appear as "undefined". Now both use MessagePack protocol for efficient binary communication.
- **Fixed fish spawning logic**: Changed from "maintain exactly 1 boss/special" to periodic spawning with cooldowns (15s for special items, 30s for bosses) to prevent infinite respawn loops when fish died immediately
- **Fixed path boundaries**: Corrected fish spawn points from 50 units outside arena to exactly at edges, constrained Bezier control points within bounds, ensured circular paths stay within arena
- **Increased regular fish spawn rate**: Reduced spawn interval from 5 to 3 ticks, increased probability from 40% to 70% for continuous fish streaming effect

## Recent Changes (2025-11-12)
- **Critical Bug Fixes:**
  - **Fixed tick synchronization data race**: Eliminated erratic fish movement by implementing proper client-server tick synchronization. Added `isSynced` flag to GameState to prevent tick advancement before first server update. Client now freezes at tick 0 until first StateDelta arrives, then snaps to server tick and resets accumulator. For large drift (>5 ticks), client snaps immediately. For minor drift (1-5 ticks), gentle correction applies ±1 per frame to gradually converge. This ensures smooth fish movement with accumulator staying in 0-33ms range and tick drift near 0.
  - Fixed infinite boss fish spawning crash by adding cooldown mechanism (90 ticks/3 seconds between boss spawns)
  - Fixed room auto-creation: rooms now auto-create when joining if they don't exist  
  - Fixed turret positioning: turret now appears above bet controls for all seats (uniform +60px offset)
  - Removed duplicate bet controls from UIScene (red/green ±buttons)
  - **Fixed fish rendering on join**: Modified GameState.updateFish to spawn sprites for any new fish ID regardless of isNewSpawn flag, allowing existing room fish to render immediately when player joins
  - **Fixed bullet firing visuals**: Added createBullet call in handleShoot to create yellow bullet graphics with bounce physics when clicking
  - **Fixed fish disappearing bug**: Changed all fish paths (LinearPath, SinePath, BezierPath) from Loop=false to Loop=true, preventing fish from reaching out-of-bounds endpoints and being removed by cleanup logic. Fish now swim continuously in looping patterns.
  - **Fixed tick synchronization data race**: Eliminated erratic fish movement by implementing proper client-server tick synchronization. Added isSynced flag to GameState to prevent tick advancement before first server update. Client now freezes at tick 0 until first StateDelta arrives, then snaps to server tick and resets accumulator. For large drift (>5 ticks), client snaps immediately. For minor drift (1-5 ticks), gentle correction applies ±1 per frame to gradually converge. GameState.applyGentleDriftCorrection() atomically updates both currentTick and tickDrift to prevent oscillation. This ensures smooth fish movement with accumulator staying in 0-33ms range and tick drift near 0.
- **Repository Reorganization:** Cleaned up file structure for better maintainability:
  - Moved `MatchManager.cs` and `MatchInstance.cs` to `Server/Managers/` directory
  - Updated namespaces to `OceanKing.Server.Managers` for consistency
  - Removed temporary/legacy files (`temp.json`, old `wwwroot` files)
  - Added `.gitignore` entry for `temp.json`
  - Vite build now properly outputs to `wwwroot/` for ASP.NET static file serving
- **Code Quality Improvements:** Applied Prettier and ESLint formatting to entire codebase
- **MessagePack Serialization:** Added contract attributes to all DTOs (KillPayoutEvent, StateDelta, PathData) for proper serialization
- **Payout System:** Implemented server-authoritative payout with credit popup animations
- **Betting UI:** Added bet adjustment controls (±buttons), bank display, and real-time credit updates
- **Migrated to Phaser 3:** Replaced vanilla Canvas with Phaser framework for better sprite/animation management
- **Implemented Parametric Path System:** Fish movement uses deterministic path functions (Linear, Sine, Bezier, Circular)
- **Bandwidth Optimization:** PathData sent only on fish spawn (IsNewSpawn=true), reducing network traffic by ~90%
- **Deterministic Client-Server Sync:** SeededRandom and 30 TPS tick rate ensure identical fish positions across client/server