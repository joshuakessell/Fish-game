# Ocean King 3 - Casino Betting Table Game

## Recent Changes (November 8, 2025)
- **Canvas Overlay Control System** (November 8, 2025 - Latest):
  - Removed all HTML UI bars (top/bottom player bars, bottom HUD) for pure fullscreen arcade experience
  - All controls now rendered as HTML overlays positioned dynamically via coordinate projection
  - Bet controls: ± buttons on either side of turret (increment by 10 credits)
  - Credits display: Semi-transparent black box with yellow text at base of turret
  - Mode buttons: Target Mode and Auto-Fire as small semi-transparent icons on left side
  - Scale-aware positioning: All overlay offsets multiply by canvas scale factors for proper alignment on all viewport sizes
  - Viewport clamping: Prevents any controls from going offscreen on mobile/small screens
  - Continuous dimension tracking: Overlays update automatically when canvas resizes or orientation changes
  - Deferred positioning: Uses requestAnimationFrame to ensure accurate layout before calculating overlay positions
  - No neon borders: All bright colored borders and glow effects removed for cleaner aesthetic

- **Enhanced Animations** (November 8, 2025):
  - Bullet hit flash: White circular flash at impact point with fade-out
  - Fish death animation: Fade, spin (720°), and shrink over 0.8 seconds
  - Shockwave animation: Expanding blue ring with rumbling "+X" text for high-value fish
  - Sequential fish deaths: Chain reaction effect for boss fish
  - Animation cleanup: All animation arrays (hitFlashes, dyingFish, shockwaves) properly filter completed entries to prevent memory leaks

- **Full-Screen Layout** (November 8, 2025):
  - Removed all black space - game now fills entire viewport
  - Changed background from black to ocean blue (#001f3f) theme
  - Body set to position: fixed with overflow: hidden for true full-screen experience
  - Canvas: 100vw × 100vh with responsive scaling maintaining 2:1 aspect ratio
  - Mobile/tablet scroll instruction overlay: "Swipe up to hide browser bars for full screen"
  - Scroll instruction appears once per session (localStorage), auto-hides after 5s or on interaction

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
- **Layout:** Fullscreen canvas-first arcade experience with overlay controls
  - Canvas: 100vw × 100vh fullscreen with responsive scaling (maintains 2:1 aspect ratio)
  - Ocean blue background (#001f3f) fills entire viewport, no black space
  - All controls rendered as HTML overlays positioned via coordinate projection
  - Scale-aware positioning: Offsets multiply by canvas scale factors for proper alignment across all viewports
  - Viewport clamping: Prevents controls from going offscreen on mobile/small screens
- **Player Controls:** Overlay-based UI anchored to turret positions
  - Bet controls: ± buttons on either side of turret (increment by 10 credits)
  - Credits display: Semi-transparent black box with yellow text at base of turret
  - Mode buttons: Target Mode and Auto-Fire as small semi-transparent icons on left side
  - No neon borders: Clean aesthetic with semi-transparent styling
  - Continuous updates: Overlays reposition automatically when canvas resizes or orientation changes
- **Visuals:** Enhanced fish graphics with realistic gradients, animated tails, flowing fins, body undulation, and detailed features. Turrets animate to face shot direction.
- **Interaction:** "Targeting Mode" allows players to lock onto specific fish with visual indicators. "Auto-Fire Mode" provides continuous shooting, which can be combined with targeting for automated gameplay.
- **Dynamic Feedback:** 
  - Bullet hit flash: White circular flash at impact point with fade-out
  - Fish death animations: Fade, spin (720°), and shrink over 0.8 seconds
  - Shockwave effects: Expanding blue ring with rumbling "+X" text for high-value fish
  - Sequential deaths: Chain reaction effect for boss fish
  - Credit popup animations: Floating, scaling, fading for visual feedback

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