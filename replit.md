# Ocean King 3 - Casino Betting Table Game

## Recent Changes (November 8, 2025)
- **Mobile/Tablet Landscape Requirement** (November 8, 2025):
  - Added landscape orientation requirement for mobile and tablet devices
  - Portrait mode displays full-screen overlay with rotation prompt message
  - Animated rotating phone icon (📱) guides users to rotate device
  - Automatic detection of mobile/tablet devices via user agent, touch capability, and screen size
  - Event listeners for orientationchange and resize ensure responsive behavior
  - Desktop users unaffected - overlay never shows on non-mobile devices

## Previous Changes (November 7, 2025) - Major UI/UX Redesign
- **Complete Layout Overhaul**: Redesigned game from margins-based to centered HTML-based UI
  - Canvas reduced from 2400×1400 to pure 1800×900 play area (no more margin offsets)
  - All player UI moved from canvas rendering to HTML elements
  - Game centered on page with black background and responsive scaling
  - Minimum 20px padding above/below for visual breathing room
- **HTML-Based Player Interface**:
  - Top player info bar: Displays names and credits for turret slots 0-2
  - Bottom player info bar: Displays names and credits for turret slots 3-5
  - Player HUD below canvas: Credits, score, bet slider (+/- buttons), Target Mode, Auto-Fire controls
  - All UI elements update in real-time via `updateMyHud()` and `updateOtherPlayers()` functions
- **Coordinate System Simplification**:
  - Removed PLAY_AREA offset logic (previously 300, 250) from both client and server
  - Client and server now operate in unified 0-1800 × 0-900 coordinate space
  - Turret positions recalculated: x=216/900/1584 (12%, 50%, 88%), y=90/810
  - Fish spawning and bullet validation work in direct coordinates (no transformations)
- **Responsive Design Improvements**:
  - Updated `resizeCanvas()` to scale based on viewport width AND height
  - Maintains 2:1 aspect ratio with minimum dimensions (200×100)
  - Prevents negative CSS sizes on small viewports
  - Allows scrolling fallback when content exceeds viewport
  - Works correctly on standard displays (1920×1080, 1366×768, etc.)
- **Clean Separation of Concerns**:
  - Canvas: Pure game rendering (fish, bullets, turrets, effects)
  - HTML: All UI, controls, and player information
  - No more mixed rendering contexts or offset calculations

## Overview
This project is a casino-style betting table game named "Ocean King 3," where up to 6 players shoot at exotic fish in a large aquarium. It is built with ASP.NET Core 8, SignalR for real-time communication, and HTML5 Canvas for client-side rendering. The game features a centered 1800×900 canvas with a clean black background, responsive layout that adapts to different screen sizes, and HTML-based UI elements positioned above and below the game area. The core business vision is to deliver an engaging, fast-paced arcade fishing experience with competitive casino mechanics, targeting a high Return-To-Player (RTP) of 97%. The game emphasizes real-time interaction, rich visual effects, and a streamlined user experience, aiming for a prominent position in the online multiplayer casino game market.

## User Preferences
- Language: C#
- Framework: ASP.NET Core 8 with SignalR
- Target: Web-based multiplayer game playable online
- Player Count: Support for 6 concurrent players
- Layout: Centered responsive canvas (1800×900) with HTML-based UI above/below game area

## System Architecture
The game follows a client-server architecture with ASP.NET Core 8 handling the server-side logic and an HTML5 Canvas-based client for rendering.

**UI/UX Decisions:**
- **Layout:** Responsive centered design with 1800×900 canvas, black background, and HTML-based UI elements
  - Canvas: 1800×900 logical size with responsive display scaling (maintains 2:1 aspect ratio)
  - Top player bar: Displays info for turret slots 0-2 (top row players)
  - Bottom player bar: Displays info for turret slots 3-5 (bottom row players)
  - Player HUD: Below canvas, shows current player's credits, score, bet controls, and game modes
  - Responsive: Adapts to viewport size while maintaining minimum dimensions and aspect ratio
- **Player UI:** All player information moved from canvas to HTML elements for cleaner separation
  - Current player: Credits, score, bet slider, +/- buttons, Target Mode, Auto-Fire buttons in HUD below canvas
  - Other players: Names and credits displayed in bars above/below canvas near their turrets
- **Visuals:** Enhanced fish graphics with realistic gradients, animated tails, flowing fins, body undulation, and detailed features. Turrets animate to face shot direction.
- **Interaction:** "Targeting Mode" allows players to lock onto specific fish with visual indicators. "Auto-Fire Mode" provides continuous shooting, which can be combined with targeting for automated gameplay.
- **Dynamic Feedback:** Fish death animations (spinning, shrinking, fading) and credit popup animations (floating, scaling, fading) provide clear visual feedback.

**Technical Implementations:**
- **Server-Side:**
    - **Game Loop:** A core game loop runs at 30 TPS, managed by `MatchInstance.cs`, handling all game state, physics, and collisions.
    - **Authoritative Server:** All game logic, RNG, fish spawning, projectile validation, and collision resolution are server-authoritative.
    - **Fish Catalog:** A spreadsheet-driven `FishCatalog.cs` defines 29 fish types with properties like payout, capture probability, spawn weight, hitbox, and speed. It supports categorized fish (Small, Medium, Large, High-Value, Special Items, Boss Fish) and ensures specific types (Special Items, Boss Fish) are always present.
    - **Casino Mechanics:** Implements a 97% RTP system with dynamically calculated destruction odds and high-volatility payout multipliers (1x-20x). Bet values multiply rewards.
    - **Player Management:** `MatchManager.cs` orchestrates multiple matches, and `PlayerManager.cs` handles player states and turret assignments.
- **Client-Side:**
    - **HTML5 Canvas:** `game.js` renders the aquarium, fish animations, and turrets in a pure 1800×900 coordinate space
    - **HTML UI:** Player HUD and info bars rendered as HTML elements with real-time updates via `updateMyHud()` and `updateOtherPlayers()`
    - **Responsive Design:** `resizeCanvas()` scales canvas display while maintaining 2:1 aspect ratio and minimum dimensions (200×100)
    - **Real-time Communication:** SignalR (`GameHub.cs`) facilitates real-time client-server communication for game state updates and player actions
    - **Boundary Enforcement:** All interactions validated to 1800×900 play area boundaries
- **Core Features:**
    - **29 Unique Fish Types:** Categorized with specific behaviors and values
    - **Dynamic Fish Spawning:** Weight-based spawning with guaranteed presence for Special Items and Boss Fish. Fish spawn at boundary edges and despawn immediately when exiting play area
    - **6 Turret System:** Positioned at 12%, 50%, 88% of canvas width; y=90 (top row), y=810 (bottom row)
    - **Advanced Shooting:** Targeting and auto-fire modes, bullets are larger, bounce off edges, and have extended lifetimes
    - **Bet Value System:** Replaces weapon selection, allowing players to adjust bet per shot (10-200 credits) via slider in HTML HUD
    - **Direct Coordinate System:** Client and server both operate in 0-1800 × 0-900 space with no offset transformations

**System Design Choices:**
- **Single-threaded game loop per match:** Simplifies concurrency management.
- **In-memory state:** Current implementation relies on in-memory state for scalability, with matches running independently and auto-cleaning.
- **Spatial collision detection:** Simple distance-based checks for efficiency.
- **Fire-and-forget state broadcasting:** Optimizes real-time updates.

## External Dependencies
- **ASP.NET Core 8:** Server-side framework.
- **SignalR:** Real-time communication library for client-server interactions.
- **HTML5 Canvas:** Client-side rendering technology.