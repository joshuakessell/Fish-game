# Ocean King 3 - Casino Betting Table Game

## Overview
This project is a casino-style betting table game named "Ocean King 3," where up to 6 players shoot at exotic fish in a large aquarium. It is built with ASP.NET Core 8, SignalR for real-time communication, and HTML5 Canvas for client-side rendering. The game features a large, central play area (1800x900 pixels) with player UI elements strategically positioned in the margins outside the play area, ensuring an unobstructed view of the gameplay. The core business vision is to deliver an engaging, fast-paced arcade fishing experience with competitive casino mechanics, targeting a high Return-To-Player (RTP) of 97%. The game emphasizes real-time interaction, rich visual effects, and a streamlined user experience, aiming for a prominent position in the online multiplayer casino game market.

## User Preferences
- Language: C#
- Framework: ASP.NET Core 8 with SignalR
- Target: Web-based multiplayer game playable online
- Player Count: Support for 6 concurrent players (reduced from 8 for better spacing)
- Layout: Large centered play area with UI in margins outside game field

## System Architecture
The game follows a client-server architecture with ASP.NET Core 8 handling the server-side logic and an HTML5 Canvas-based client for rendering.

**UI/UX Decisions:**
- **Layout:** A 2400x1400 canvas features a centered 1800x900 main play area, leaving 300px margins on the sides and 250px on top/bottom for player-specific UI. This design keeps the central game action clean and unobstructed.
- **Player UI:** All player information (credits, bet controls, name) is integrated directly around their respective turrets on the canvas, removing floating windows and reducing clutter.
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
    - **HTML5 Canvas:** `game.js` renders the aquarium, fish animations, turrets, and all UI elements.
    - **Real-time Communication:** SignalR (`GameHub.cs`) facilitates real-time client-server communication for game state updates and player actions.
    - **Boundary Enforcement:** Client-side rendering and interaction handlers are strictly clipped and validated to the 1800x900 play area.
- **Core Features:**
    - **29 Unique Fish Types:** Categorized with specific behaviors and values.
    - **Dynamic Fish Spawning:** Weight-based spawning with guaranteed presence for Special Items and Boss Fish. Fish swim continuously from off-screen to off-screen in curved paths.
    - **6 Turret System:** Evenly distributed turret positions for 6 players.
    - **Advanced Shooting:** Targeting and auto-fire modes, bullets are larger, bounce off edges, and have extended lifetimes.
    - **Bet Value System:** Replaces weapon selection, allowing players to adjust bet per shot (10-200 credits).

**System Design Choices:**
- **Single-threaded game loop per match:** Simplifies concurrency management.
- **In-memory state:** Current implementation relies on in-memory state for scalability, with matches running independently and auto-cleaning.
- **Spatial collision detection:** Simple distance-based checks for efficiency.
- **Fire-and-forget state broadcasting:** Optimizes real-time updates.

## External Dependencies
- **ASP.NET Core 8:** Server-side framework.
- **SignalR:** Real-time communication library for client-server interactions.
- **HTML5 Canvas:** Client-side rendering technology.