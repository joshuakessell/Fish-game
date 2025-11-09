# Ocean King 3 - Casino Betting Table Game

## Overview
This project is a casino-style betting table game named "Ocean King 3," where up to 6 players shoot at exotic fish in a large aquarium. It is built with ASP.NET Core 8, SignalR for real-time communication, and HTML5 Canvas for client-side rendering. The game features a fullscreen 1800×900 canvas with ocean blue background, responsive scaling that adapts to all screen sizes, and dynamic HTML overlay controls positioned via coordinate projection. All UI elements (bet controls, credits display, mode buttons) are rendered as semi-transparent overlays anchored to turret positions with scale-aware positioning. The core business vision is to deliver an engaging, fast-paced arcade fishing experience with competitive casino mechanics, targeting a high Return-To-Player (RTP) of 97%. The game emphasizes real-time interaction, rich visual effects with enhanced animations (bullet flashes, fish death, shockwaves), and a streamlined fullscreen user experience, aiming for a prominent position in the online multiplayer casino game market.

## User Preferences
- Language: C#
- Framework: ASP.NET Core 8 with SignalR
- Target: Web-based multiplayer game playable online
- Player Count: Support for 6 concurrent players
- Layout: Fullscreen canvas (100vw×100vh) with HTML overlay controls positioned via coordinate projection

## System Architecture
The game follows a client-server architecture with ASP.NET Core 8 handling the server-side logic and an HTML5 Canvas-based client for rendering.

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
    - **Authentication Flow:** Guest login via REST endpoint, stores JWT, connects to SignalR with `accessTokenFactory`.
    - **Lobby UI:** Three-screen flow: Login → Lobby → Game. Displays room list with pagination and solo mode.
    - **HTML5 Canvas:** `game.js` renders the aquarium, fish animations, and turrets in a pure 1800×900 coordinate space.
    - **HTML UI:** Player HUD and info bars rendered as HTML elements with real-time updates.
    - **Responsive Design:** `resizeCanvas()` scales canvas display while maintaining 2:1 aspect ratio and minimum dimensions.
    - **Real-time Communication:** SignalR (`GameHub.cs`) with JWT authentication facilitates real-time client-server communication.
    - **Boundary Enforcement:** All interactions validated to 1800×900 play area boundaries.
- **Core Features:**
    - 29 Unique Fish Types categorized with specific behaviors and values.
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
- **ASP.NET Core 8:** Server-side framework.
- **SignalR:** Real-time communication library for client-server interactions.
- **HTML5 Canvas:** Client-side rendering technology.