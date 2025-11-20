# Ocean King 3 - Casino Betting Table Game

## Overview
This project is "Ocean King 3," a casino-style betting table game where up to 6 players shoot at exotic fish in a large aquarium. Built with ASP.NET Core 8, SignalR for real-time communication, and Phaser 3 for client-side rendering, it targets a high Return-To-Player (RTP) of 97%. The game emphasizes real-time interaction, rich visual effects, and a streamlined fullscreen user experience for the online multiplayer casino game market, featuring responsive scaling and dynamic HTML overlay controls. It utilizes parametric path-based fish movement with deterministic client-server synchronization to reduce bandwidth. The game features a mobile-optimized entry flow with orientation detection, swipe-to-start prompts, and scroll-locked fullscreen gameplay.

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
    - **Loading Screen:** Beautiful loading screen with Ocean Attack logo centered on black background, animated progress bar tracking asset loading, and smooth fade transitions. When loading completes, progress bar fades out and "Tap to Continue" fades in. On tap, everything fades out and transitions to Lobby. Auto-assigns guest names (Player####) to skip manual login.
    - **Lobby UI:** Two-screen flow: Boot (loading + tap) → Lobby → Game, displaying room lists and solo mode options.
    - **Phaser.Curves Path System:** Fish movement uses Phaser.Curves API (Line, CubicBezier, Spline) with server-generated control points for deterministic synchronization. PathComputer uses curve.getPoint(t) for smooth rendering. Curve volatility reduced by 50-60% (sine amplitude 5-25f→3-12f, bezier Y-offsets ±300f→±150f) to prevent direction flipping.
    - **GameState Manager:** Singleton managing game state, SignalR connection, FishPathManager, and Phaser scene coordination. Debug overlay displays ACC as tick percentage (0-100%) and PROG as clamped integer (0-100) for stable visualization.
    - **FishSpriteManager:** Tracks killed vs path-completed fish using killedFishIds Set with defensive cleanup to prevent memory leaks from recycled IDs. Only killed fish play death animations; path-completed fish fade silently.
    - **Deterministic RNG:** SeededRandom class ensures identical random sequences across client and server.
    - **Responsive Design:** Phaser canvas scales while maintaining a 2:1 aspect ratio within an 1800×900 coordinate space.
    - **Real-time Communication:** SignalR with JWT authentication and optimized StateDelta broadcasts.
- **Core Features:**
    - Categorized fish types with unique behaviors and values.
    - Phaser.Curves-Based Movement for all fish using server-generated control points with client-side Phaser curve rendering and deterministic synchronization.
    - Dynamic Fish Spawning based on weight: Clownfish spawn in lines of 3-6, Neon Tetra in groups of 2-4, Butterflyfish in diamond formations of 4-8.
    - **Fish Schooling System:** Follow-the-leader formations with time-staggered spawning (15-20 tick delays) and spatial separation (120f longitudinal offset). Uses separated lateralIndex (perpendicular formation shape) and trailingRank (sequential trailing position) for proper diamond and row formations. All fish trail behind the leader regardless of formation type.
    - 6 Turret System with specific positioning.
    - Advanced Shooting with targeting, auto-fire, and server-side homing bullets.
    - **Double-Tap Lock-On:** Double-tap any fish to activate auto-fire targeting; tap anywhere else to cancel.
    - **Auto-Targeting:** Type-specific auto-targeting with visual crosshair indicator, intelligent retargeting, and exclusive mode behavior.
    - **Enhanced Fish Visuals:** Larger sprite sizes for better visibility (Clownfish 1.5x, Butterflyfish 1.8x, Shark 2.2x), horizontal mirroring for natural orientation (no upside-down fish).
    - **Fish Orientation:** All fish use horizontal mirroring (flipX) with ±75° vertical tilt instead of full rotation, preventing sideways swimming and upside-down appearance. Manta Ray (Type 14) uses inverted flipX and tilt logic due to sprite facing left. Wave Rider (Type 21) uses velocity threshold (1.0) to prevent direction flipping during sine wave oscillations.
    - **Collision System:** Increased hitbox radii for better gameplay - medium fish (70-85%), large fish (60-85%), bonus fish (71%), boss fish (40-50%) for improved player feedback and hit detection.
    - **Reward Animations:** Comprehensive visual feedback for fish kills including death animations (white flash, scale pop, spiral rotation), floating payout text, and arcing spinning coin animations orchestrated via a RewardAnimationManager. Path-completed fish fade out silently (300ms alpha tween) without flash effects.
    - **Transaction Ledger:** Clickable bank display shows real-time TransactionLedger.getCurrentBalance() instead of server-synced credits, opens paginated ledger (10 transactions per page) with grouped shot entries (e.g., "3 shots fired -$30" between kills). Pagination fixes mobile scroll blocking with Previous/Next buttons.
    - Bet Value System replacing weapon selection, allowing bet adjustment per shot via Plus/Minus buttons (protected from firing bullets).
    - Direct Coordinate System (0-1800 × 0-900) for consistent interaction.
    - **UI Interaction Protection:** All interactive UI elements (bet buttons, bank display) marked with isUI data flag and gated by hitTestPointer to prevent accidental bullet firing.

**System Design Choices:**
- Single-threaded game loop per match.
- In-memory state for scalability.
- Spatial collision detection.
- Fire-and-forget state broadcasting for real-time updates.

## Testing & Validation
**Test Coverage:**
- **C# Backend:** 160+ tests using xUnit, Moq, and FluentAssertions with 74.46% line coverage
  - Unit tests for RTP mechanics, fish spawning, collision detection, boss progression
  - Integration tests for MatchInstance, SignalR communication, and game loops
  - Deterministic seeded Random injection for reproducible RTP validation
  - TaskCompletionSource pattern for async testing (no Thread.Sleep)
- **TypeScript Frontend:** 47/47 tests passing (100%) using Vitest
  - Path calculations, state management, and rendering logic tested
  
**RTP Validation Bot (November 2025):**
- **Bot Framework:** Single-threaded sequential C# client with SignalR integration
- **Initial Test (6,700 shots before SignalR timeout):**
  - **Measured RTP: 83.9%** (stabilized after initial variance)
  - Total Wagered: $67,000, Total Paid Out: ~$56,213
  - Hit Count: 965 kills, Connection Duration: 21 minutes
  - RTP Progression: Started at 36-44% (shots 100-300), peaked at 92.9% (shot 2300), stabilized at 84-86% (shots 3000-6700)
  - **Finding:** Actual RTP 13 percentage points below 97% target
- **RTP Tuning Process (November 17, 2025):**
  - **Attempt 1 (Failed):** Increased boss BaseValue 40-60%, fish capture +5pp, RTP 1.05→1.15
    - Result: 69.76% RTP @ 500 shots (DOWN from 83.9%)
    - Root Cause: Formula DestructionOdds = RTP / (BaseValue × 1.74) inverted - higher BaseValue decreased kill odds
  - **Attempt 2 (Partial):** Corrected scaling, set RTP=1.8
    - Result: 80.16% RTP @ 500 shots (improved but still below target)
    - Analysis: Fish alone provide ~80% RTP, need ~17pp from bosses
  - **Attempt 3 (In Progress):** Set RTP=3.4 based on boss engagement formula (0.17 / q where q≈5%)
    - Running 10,000-shot validation to measure actual boss engagement and RTP convergence
- **Final Tuning (Pending Validation):**
  - Boss BaseValue: Increased 40-60% (Rare: 50→70 to 300→420, Ultra-rare: 5000→7500 to 20000→30000)
  - Fish Capture Probability: Type 0: 55%→60%, Type 1: 27.5%→32%, Type 2: 18.3%→22%
  - RTP Constant: 1.05→3.4 (compensates for BaseValue scaling while targeting 97% RTP)
  - Formula: DestructionOdds = 3.4 / (BaseValue × 1.74)
- **Key Learnings:**
  - 500-shot samples too small for boss kill convergence
  - Fish RTP and boss RTP must be tuned independently
  - Boss engagement fraction (q) is critical for setting RTP constant
  - Formula requires careful scaling when adjusting BaseValue
- **Technical Implementation:**
  - Random target selection (fish or coordinates) per shot
  - 200ms payout timeout per shot for efficient execution
  - Real-time telemetry with shot-by-shot JSON session logging
  - Properly matched payouts to pending shots via PlayerSlot filtering

## External Dependencies
**Backend:**
- **ASP.NET Core 8:** Server-side framework.
- **SignalR:** Real-time communication library mapped to `/gamehub` endpoint.

**Frontend:**
- **Phaser 3:** HTML5 game framework.
- **TypeScript:** Type-safe language.
- **Vite:** Fast development server and build tool with dual proxy configuration:
  - `/api/gamehub` → proxies to `/gamehub` (SignalR WebSocket with path rewrite)
  - `/api/*` → proxies to `/api/*` (REST API endpoints)
- **@microsoft/signalr:** SignalR client library connecting via `/api/gamehub` proxy path.