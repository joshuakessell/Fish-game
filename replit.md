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
- **Player Hub:** Detailed golden/orange missile turret positioned at center with golden ring platform. Hub layout (left to right): Bank (gold text, number only) | Minus button (blue circle) | Bet value (large white text, center) | Plus button (blue circle) | Player name (brown badge). Features detailed 3D-style turret with cylindrical body, dome top, and rotating barrel with metallic shading.
- **Visuals:** Enhanced fish graphics with realistic gradients, animated tails, flowing fins, body undulation, and detailed features. Detailed missile turrets with golden/orange metallic appearance and rotating barrels. Blurred glowing bullet effects with layered transparency for arcade feel.
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

## Transaction Ledger System (2025-11-23)
**Purpose:** Comprehensive transaction tracking system with access controls for monitoring player bets, wins, and credit changes in real-time.

**Client-Side Implementation:**
- **GameState Ledger Tracking:** Auto-records all bets (via bullet count monitoring) and wins (via PayoutEvents) for all players, storing per-player transaction history with timestamps, amounts, and running balances.
- **Event Subscription System:** Multi-subscriber event pattern (add/remove listener methods) allows multiple UI components (BettingUI, PlayersDisplayUI, LedgerScene) to listen to credit changes, payouts, and game events without conflicts.
- **LedgerScene Modal:** Paginated modal UI (20 transactions per page) displaying transaction history with timestamp, type (BET/WIN), amount (color-coded red/green), balance, and fish details. Supports keyboard navigation (Escape to close).
- **PlayersDisplayUI:** Shows all active players with clickable bank displays positioned by seat slot. Clicking a player's bank opens their ledger modal (subject to access control).
- **Access Control:** Normal players can only view their own ledger; spectator mode (myPlayerSlot === null) can view any player's ledger for multi-bot testing scenarios.
- **StateDelta PascalCase:** Client properly consumes PascalCase fields (TickId, Fish, Projectiles, Players, PayoutEvents) matching C# server contract for correct runtime behavior.

**Spectator Mode (spectator.html):**
- **Per-Player Ledger Modals:** Clickable player cards open individual transaction history modals with pagination.
- **Bet Tracking:** Monitors projectile count changes to detect and record new shots (bets) with player bet values.
- **Win Tracking:** Parses PayoutEvents with PascalCase field names (FishId, Payout, PlayerSlot) to record win transactions.
- **Global + Per-Player Ledgers:** Maintains both a global ledger (all transactions) and per-player ledgers (individual histories) for comprehensive multi-bot testing.

**Key Files:**
- `src/systems/GameState.ts`: Event subscription system, ledger data storage, StateDelta handling with PascalCase
- `src/types/LedgerTypes.ts`: Transaction data structures (BET/WIN types, LedgerEntry, PlayerLedger)
- `src/scenes/LedgerScene.ts`: Modal UI with pagination and transaction table rendering
- `src/entities/PlayersDisplayUI.ts`: Multi-player bank display with click handlers and access control
- `Public/spectator.html`: Spectator dashboard with per-player ledger modals and bullet-count bet tracking

## Recent Changes (2025-11-24)
- **Removed Old UI Elements:** Eliminated obsolete UIScene betting controls (red minus/green plus buttons) and top-right credits display that were replaced by BettingUI.
- **Restored Debug Overlay:** Added debug diagnostics panel in top-left corner showing FPS, tick count, fish count, bullets, credits, and current bet for development testing.
- **Limited Fish Spawning (Debug Mode):** Temporarily restricted fish spawning to only 3 small fish types (0-2) with max 15 fish on screen for incremental testing of fish movement and behavior.
- **Redesigned Wider Hub Platform:** Expanded hub to 640px width with three distinct sections: left rounded rectangle (-320 to -110) for bank, center ellipse (-110 to +110) for bet controls, and right rounded rectangle (+110 to +320) for player name. Sides go straight back without visible curved edges underneath.
- **Enhanced Text Readability:** Added dark semi-transparent backgrounds behind bank and player name text for improved visibility against the golden hub platform.

## Recent Changes (2025-11-23)
- **Redesigned Player Hub UI:** Completely revamped betting controls to match arcade reference photo with dimensional golden platform (520×95 ellipse with layered shadows, bevels, highlights), blue bet medallion (42px radius) centered with red "Bet: X Credits" label, blue +/- circles (34px radius) positioned at ±70px, bank display at -210px, and player name badge at +210px.
- **Turret Repositioning:** Updated positioning logic so turrets appear ABOVE controls for bottom seats (0-2) and BELOW controls for top seats (3-5) using dedicated offset constants (turretOffsetY: ±70px).
- **Enhanced Button Interactions:** Implemented hover states and press feedback using redrawButton helper to preserve dimensional styling without visual artifacts.

## Recent Changes (2025-11-12)
- **Migrated to Phaser 3:** Replaced vanilla Canvas with Phaser framework for better sprite/animation management.
- **Implemented Parametric Path System:** Fish movement now uses deterministic path functions (Linear, Sine, Bezier, Circular).
- **Bandwidth Optimization:** PathData sent only on fish spawn (IsNewSpawn=true), reducing network traffic by ~90%.
- **Deterministic Client-Server Sync:** SeededRandom and 30 TPS tick rate ensure identical fish positions across client/server.
- **TypeScript Path Port:** Created exact TypeScript mirrors of C# path implementations with determinism validation tests.