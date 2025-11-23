# Ocean King 3 - Comprehensive Development Plan

## Executive Summary
This document outlines the complete development plan for Ocean King 3, including code cleanup, animation implementation, asset creation, comprehensive testing, and RTP validation through automated bot players.

---

## Table of Contents
1. [Code Cleanup & Quality](#1-code-cleanup--quality)
2. [Animation System Implementation](#2-animation-system-implementation)
3. [Asset Requirements & Creation](#3-asset-requirements--creation)
4. [Testing Framework](#4-testing-framework)
5. [RTP Bot Testing System](#5-rtp-bot-testing-system)
6. [Task List](#6-detailed-task-list)
7. [Asset Requirement Spreadsheet](#7-asset-requirement-spreadsheet)
8. [Implementation Timeline](#8-implementation-timeline)

---

## 1. Code Cleanup & Quality

### 1.1 Dead Code Removal

#### TypeScript Dead Code
- **GameState.ts**
  - `waitForRoomJoin()` - Never called
  - `reset()` - Never called
- **UIScene.ts**
  - `updateCredits()` - Never called
- **vite.config.ts**
  - Lines 14-32: WebSocket proxy configuration (no longer needed)

#### C# Dead Code
- **Database Layer (Completely Unused)**
  - `Server/Data/OceanKingDbContext.cs`
  - `Server/Data/User.cs`
  - `Server/Data/GuestSession.cs`
  - `Server/Services/JwtTokenService.cs`
- **GameHub.cs**
  - `JoinMatch()` method marked as `[Obsolete]`
- **Unused Manager Methods**
  - `FishManager.GetSpeedForType()`
  - `RoundManager.Initialize()` and `Update()`
  - `CollisionResolver.ResolveCollisions()` (instantiated but never invoked)
  - `PathGenerator.GenerateCircularOrComplexPath()`
  - `PathGenerator.GenerateBossPath()`
  - `KillSequenceHandler` methods: `ApplyInteractionResult()`, `ProcessSequences()`, `ProcessSequenceStep()`

### 1.2 Code Quality Tools Configuration

#### Prettier Configuration (.prettierrc)
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

#### ESLint Configuration (Already exists, needs npm scripts)
```json
{
  "scripts": {
    "lint": "eslint src/**/*.ts src/**/*.tsx",
    "format": "prettier --write src/**/*.{ts,tsx,css,html}",
    "format:check": "prettier --check src/**/*.{ts,tsx,css,html}",
    "quality": "npm run lint && npm run format:check"
  }
}
```

### 1.3 Critical Fixes

#### Fix Localhost Hardcoding
**File:** `src/systems/GameState.ts` (Line 142)
```typescript
// OLD (hardcoded):
.withUrl("http://localhost:8080/gamehub", {

// NEW (environment variable):
const backendUrl = import.meta.env.VITE_BACKEND_URL || 
  (typeof window !== 'undefined' 
    ? window.location.origin.replace(':5000', ':8080') 
    : 'http://localhost:8080');
.withUrl(`${backendUrl}/gamehub`, {
```

---

## 2. Animation System Implementation ✅ **COMPLETED**

### 2.1 Spritesheet Structure (ACTUAL IMPLEMENTATION)

#### Frame Layout - Simplified 8-Frame Swim Loops
- **Swimming Animation ONLY:** 8 frames (extracted from 25-frame source at indices 0, 3, 6, 9, 12, 15, 18, 21)
- **Death Animation:** Tween-based spiral rotation + fade (no sprite frames needed)
- **Directional Facing:** Rotation-based (sprite rotates to match velocity angle)
- **Total per Fish:** 8 frames per spritesheet

#### Actual Frame Dimensions per Fish Type
| Fish Type | Type ID | Frame Size | Total Spritesheet Size | File Name |
|-----------|---------|------------|----------------------|-----------|
| Clownfish | 0 | 72×32 | 576×32 (8 frames) | fish-0.png |
| Neon Tetra | 1 | 72×32 | 576×32 (8 frames) | fish-1.png |
| Butterflyfish | 2 | 80×40 | 640×40 (8 frames) | fish-2.png |
| Lionfish | 6 | 128×56 | 1024×56 (8 frames) | fish-6.png |
| Triggerfish | 9 | 120×48 | 960×48 (8 frames) | fish-9.png |
| Hammerhead Shark | 12 | 160×40 | 1280×40 (8 frames) | fish-12.png |
| Giant Manta Ray | 14 | 224×96 | 1792×96 (8 frames) | fish-14.png |
| Wave Rider | 21 | 112×48 | 896×48 (8 frames) | fish-21.png |

**Design Decision:** Simplified from complex multi-state animations (swim/idle/turn/death) to:
- Single 8-frame swim loop (10fps, snappy arcade feel)
- Rotation handles all directional facing
- Tweens handle death effects

### 2.2 Phaser Animation Implementation

#### Loading Spritesheets (BootScene.ts)
```typescript
// Spritesheet loads with fallback to static images
this.load.spritesheet('fish-0', 'assets/spritesheets/fish/fish-0.png', {
  frameWidth: 72,
  frameHeight: 32
});
this.load.image('fish-0-static', 'assets/static/fish-0.png'); // Fallback

// Animation creation (auto-detects if spritesheet exists)
private createFishAnimations(): void {
  const fishConfigs = [
    { typeId: 0, frames: 8 },   // Clownfish
    { typeId: 1, frames: 8 },   // Neon Tetra
    { typeId: 2, frames: 8 },   // Butterflyfish
    { typeId: 6, frames: 8 },   // Lionfish
    { typeId: 9, frames: 8 },   // Triggerfish
    { typeId: 12, frames: 8 },  // Hammerhead
    { typeId: 14, frames: 8 },  // Manta Ray
    { typeId: 21, frames: 8 },  // Wave Rider
  ];

  fishConfigs.forEach(config => {
    const key = `fish-${config.typeId}`;
    if (this.textures.exists(key)) {
      this.anims.create({
        key: `${key}-swim`,
        frames: this.anims.generateFrameNumbers(key, { 
          start: 0, 
          end: config.frames - 1 
        }),
        frameRate: 10,
        repeat: -1
      });
    }
  });
}
```

#### Rotation-Based Directional Facing (FishSprite.ts)
```typescript
// Automatic rotation based on velocity from path
updateRotation(velocity: { x: number; y: number }): void {
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  if (speed < 0.1) return; // Don't rotate if stationary

  const targetAngle = Math.atan2(velocity.y, velocity.x);

  // Special handling for Type 14 (Manta Ray)
  if (this.typeId === 14) {
    // Use flipX for left vs right facing
    this.setFlipX(velocity.x < 0);
    
    // Only tilt vertically (clamped to ±45°)
    const tiltAngle = Math.atan2(velocity.y, Math.abs(velocity.x));
    const clampedTilt = Phaser.Math.Clamp(tiltAngle, -Math.PI / 4, Math.PI / 4);
    
    this.rotation = Phaser.Math.Linear(this.rotation || 0, clampedTilt, 0.15);
  } else {
    // Normal fish: full rotation to match velocity angle
    this.rotation = Phaser.Math.Linear(this.rotation || 0, targetAngle, 0.15);
  }
}
```

**Manta Ray Constraint Rationale:** Type 14 uses `flipX` for horizontal facing and limits rotation to ±45° vertical tilt to prevent unnatural upside-down or sideways orientations, maintaining realistic manta ray gliding appearance.

### 2.3 Death Animation - Tween-Based Spiral Effect

```typescript
public playDeathSequence(): Promise<void> {
  return new Promise<void>((resolve) => {
    const baseScale = FishSprite.getScaleForType(this.typeId);
    
    // 1. White flash (100ms, yoyo)
    this.scene.tweens.add({
      targets: this,
      tint: 0xffffff,
      duration: 100,
      yoyo: true,
      repeat: 1,
    });

    // 2. Scale pop (1.0 → 1.2 → 1.0, 200ms)
    this.scene.tweens.add({
      targets: this,
      scaleX: baseScale * 1.2,
      scaleY: baseScale * 1.2,
      duration: 200,
      yoyo: true,
      ease: 'Cubic.easeOut',
    });

    // 3. Spiral rotation (3 full spins = 1080°, 1 second)
    this.scene.tweens.add({
      targets: this,
      angle: { from: 0, to: 1080 },
      duration: 1000,
      ease: 'Cubic.easeOut',
    });

    // 4. Fade out (alpha 1.0 → 0, 400ms)
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this.setVisible(false);
        resolve();
      }
    });
  });
}
```

**Design Decision:** Tween-based death effects instead of sprite frames reduces asset count from 6 frames × 8 fish types = 48 frames to **zero additional frames**, while providing smooth, customizable death animations.

### 2.4 Coin Animation System

#### Coin Arc Trajectory
```typescript
public animateCoinToBank(
  startPos: { x: number, y: number },
  endPos: { x: number, y: number },
  isOwnKill: boolean
): void {
  const coin = this.scene.add.sprite(startPos.x, startPos.y, 
    isOwnKill ? 'coin-gold' : 'coin-silver');
  
  // Create Bezier curve path
  const curve = new Phaser.Curves.QuadraticBezier(
    new Phaser.Math.Vector2(startPos.x, startPos.y),
    new Phaser.Math.Vector2((startPos.x + endPos.x) / 2, startPos.y - 100),
    new Phaser.Math.Vector2(endPos.x, endPos.y)
  );
  
  // Animate along path
  const follower = { t: 0 };
  this.scene.tweens.add({
    targets: follower,
    t: 1,
    duration: 1000,
    ease: 'Cubic.easeInOut',
    onUpdate: () => {
      const point = curve.getPoint(follower.t);
      coin.setPosition(point.x, point.y);
      coin.rotation += 0.1; // Spin during flight
    },
    onComplete: () => {
      // Play collection effect
      this.playCollectionEffect(endPos);
      coin.destroy();
    }
  });
}
```

### 2.5 Payout Text Effects

```typescript
public showPayoutText(
  amount: number,
  position: { x: number, y: number },
  isOwnKill: boolean
): void {
  const style = {
    fontFamily: 'Arial Black',
    fontSize: isOwnKill ? '32px' : '24px',
    color: isOwnKill ? '#FFD700' : '#C0C0C0',
    stroke: '#000000',
    strokeThickness: 4
  };
  
  const text = this.scene.add.text(
    position.x,
    position.y,
    `+${amount}`,
    style
  );
  
  // Float upward and fade
  this.scene.tweens.add({
    targets: text,
    y: position.y - 100,
    alpha: 0,
    duration: 2000,
    ease: 'Cubic.easeOut',
    onComplete: () => text.destroy()
  });
}
```

---

## 3. Asset Requirements & Creation

### 3.1 CGDream AI Prompts for Fish Species

#### Small Fish (Types 0-2)
```
Type 0 - Clownfish:
"Sprite sheet of cute clownfish character, swimming animation, 8 frames, 
side view, vibrant orange with white stripes, black fin edges, 
game asset style, transparent background, 64x32 pixels per frame"

Type 1 - Neon Tetra:
"Sprite sheet of neon tetra fish, swimming animation, 8 frames,
side view, electric blue stripe, silver body, red tail,
game asset style, transparent background, 64x32 pixels per frame"

Type 2 - Butterflyfish:
"Sprite sheet of yellow butterflyfish, swimming animation, 8 frames,
side view, bright yellow with black stripes, eye spot on tail,
game asset style, transparent background, 64x32 pixels per frame"
```

#### Medium Fish (Types 6, 9)
```
Type 6 - Lionfish:
"Sprite sheet of lionfish enemy, swimming animation, 8 frames,
side view, red and white stripes, venomous spines extended,
slightly menacing, game asset style, transparent background, 96x48 pixels"

Type 9 - Triggerfish:
"Sprite sheet of triggerfish, swimming animation, 8 frames,
side view, blue-green scales, yellow accents, angular body shape,
game asset style, transparent background, 96x48 pixels"
```

#### Large Fish (Types 12, 14)
```
Type 12 - Hammerhead Shark:
"Sprite sheet of hammerhead shark boss, swimming animation, 8 frames,
side view, gray body, distinctive hammer-shaped head, powerful tail,
intimidating presence, game asset style, transparent background, 128x64 pixels"

Type 14 - Giant Manta Ray:
"Sprite sheet of giant manta ray boss, swimming animation, 8 frames,
top-down angled view, dark blue body, white underside, wing-like fins,
majestic gliding motion, game asset style, transparent background, 128x64 pixels"
```

#### Special/Bonus Fish (Type 21)
```
Type 21 - Wave Rider:
"Sprite sheet of magical wave rider fish, swimming animation, 8 frames,
side view, iridescent scales, glowing fins, ethereal appearance,
particle trail effect, game asset style, transparent background, 96x48 pixels"
```

### 3.2 Effect Assets

#### Coin Sprites
```
Golden Coin (Own Kills):
"Sprite sheet of spinning gold coin, 8 rotation frames, 
3D perspective, shiny metallic surface, embossed fish symbol,
game currency style, transparent background, 32x32 pixels"

Silver Coin (Other Kills):
"Sprite sheet of spinning silver coin, 8 rotation frames,
3D perspective, metallic surface, embossed wave pattern,
game currency style, transparent background, 24x24 pixels"
```

#### Particle Effects
```
Death Bubbles:
"Sprite sheet of bubble burst animation, 6 frames,
water bubbles popping, various sizes, transparent with highlights,
underwater effect, transparent background, 64x64 pixels"

Golden Sparkles:
"Sprite sheet of golden sparkle effect, 8 frames,
star-shaped particles, glowing animation, various sizes,
celebration effect, transparent background, 32x32 pixels"
```

### 3.3 Spritesheet Processing Workflow

#### Step 1: Generate Raw Assets
1. Use CGDream.ai with prompts above
2. Generate 4 variations per asset
3. Select best quality version
4. Download as PNG with transparency

#### Step 2: Process with TexturePacker
1. Import all frames for each fish type
2. Settings:
   - Algorithm: MaxRects
   - Trim mode: Trim transparent pixels
   - Pivot point: Center
   - Format: Phaser 3 (JSON)
3. Export as:
   - `[fishname].png` (texture atlas)
   - `[fishname].json` (frame data)

#### Step 3: Organize File Structure
```
assets/
├── spritesheets/
│   ├── fish/
│   │   ├── clownfish.png
│   │   ├── clownfish.json
│   │   ├── neon_tetra.png
│   │   ├── neon_tetra.json
│   │   └── ...
│   ├── effects/
│   │   ├── coins.png
│   │   ├── coins.json
│   │   ├── particles.png
│   │   └── particles.json
│   └── ui/
│       ├── buttons.png
│       └── buttons.json
```

---

## 4. Testing Framework

### 4.1 C# Backend Testing Setup

#### Install Testing Packages
```bash
dotnet add package xunit
dotnet add package xunit.runner.visualstudio
dotnet add package Moq
dotnet add package FluentAssertions
dotnet add package coverlet.collector
```

#### Test Structure
```
Tests/
├── Unit/
│   ├── Mechanics/
│   │   ├── RTPCalculationTests.cs
│   │   ├── CaptureProbabilityTests.cs
│   │   └── BossProgressiveTests.cs
│   ├── Paths/
│   │   ├── PathGenerationTests.cs
│   │   └── SeededRandomTests.cs
│   └── Collision/
│       └── CollisionDetectionTests.cs
├── Integration/
│   ├── MatchInstanceTests.cs
│   ├── SignalRHubTests.cs
│   └── StatebroadcastTests.cs
└── E2E/
    └── GameplayFlowTests.cs
```

#### Sample RTP Test
```csharp
[Fact]
public void RTP_ConvergesToExpectedValue_After1MillionShots()
{
    // Arrange
    var fishManager = new FishManager();
    var totalWagered = 0m;
    var totalWon = 0m;
    var shots = 1_000_000;
    
    // Act
    for (int i = 0; i < shots; i++)
    {
        var betValue = 10;
        totalWagered += betValue;
        
        var fishType = GetRandomFishType();
        var captured = SimulateCapture(fishType, betValue);
        
        if (captured)
        {
            totalWon += fishType.Payout * betValue;
        }
    }
    
    var actualRTP = (totalWon / totalWagered) * 100;
    
    // Assert
    actualRTP.Should().BeInRange(104.5m, 105.5m); // ±0.5% tolerance
}
```

### 4.2 TypeScript Frontend Testing

#### Install Vitest
```bash
npm install -D vitest @vitest/ui happy-dom @testing-library/jest-dom
```

#### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
});
```

#### Sample Animation Test
```typescript
describe('FishSprite Animations', () => {
  it('should play death animation on payout event', async () => {
    const scene = new TestScene();
    const fish = new FishSprite(scene, 100, 100, 'fish-0', 123, 0);
    
    const deathSpy = vi.spyOn(fish, 'playDeathSequence');
    
    // Trigger payout event
    gameState.onPayoutEvent(123, 50, 1, true);
    
    expect(deathSpy).toHaveBeenCalled();
    expect(fish.anims.currentAnim?.key).toBe('fish-0-death');
  });
  
  it('should rotate to face movement direction', () => {
    const fish = new FishSprite(scene, 100, 100, 'fish-0', 124, 0);
    
    fish.updateRotation({ x: 100, y: 0 }); // Moving right
    expect(fish.rotation).toBeCloseTo(0, 1);
    
    fish.updateRotation({ x: -100, y: 0 }); // Moving left
    expect(fish.flipY).toBe(true);
    expect(fish.rotation).toBeCloseTo(Math.PI, 1);
  });
});
```

---

## 5. RTP Bot Testing System

### 5.1 Bot Client Architecture

```csharp
public class OceanKingBot
{
    private HubConnection _connection;
    private string _botId;
    private BotStatistics _stats;
    private Random _rng = new();
    
    public class BotStatistics
    {
        public int TotalShots { get; set; }
        public decimal TotalWagered { get; set; }
        public decimal TotalWon { get; set; }
        public Dictionary<int, int> FishKillCounts { get; set; } = new();
        public Dictionary<int, int> FishShotCounts { get; set; } = new();
        
        public decimal CalculateRTP() => (TotalWon / TotalWagered) * 100;
        
        public Dictionary<int, float> CalculateCaptureRates()
        {
            return FishShotCounts.ToDictionary(
                kvp => kvp.Key,
                kvp => (float)FishKillCounts.GetValueOrDefault(kvp.Key, 0) / kvp.Value
            );
        }
    }
    
    public async Task ConnectAsync(string hubUrl, string botName)
    {
        _botId = $"Bot_{botName}_{Guid.NewGuid():N}";
        
        // Authenticate as guest
        var authResponse = await AuthenticateAsGuest(_botId);
        var token = authResponse.Token;
        
        _connection = new HubConnectionBuilder()
            .WithUrl(hubUrl, options =>
            {
                options.AccessTokenProvider = () => Task.FromResult(token);
            })
            .WithAutomaticReconnect()
            .Build();
        
        // Register event handlers
        _connection.On<StateDelta>("StateDelta", ProcessStateDelta);
        _connection.On<PayoutEvent>("PayoutEvent", RecordPayout);
        
        await _connection.StartAsync();
        Console.WriteLine($"[{_botId}] Connected to SignalR");
    }
    
    public async Task JoinRoomAndPlay(string roomId, int seatNumber, int durationMinutes)
    {
        // Join room
        await _connection.InvokeAsync("JoinRoom", roomId, seatNumber);
        Console.WriteLine($"[{_botId}] Joined room {roomId} at seat {seatNumber}");
        
        var endTime = DateTime.Now.AddMinutes(durationMinutes);
        var shotInterval = TimeSpan.FromMilliseconds(250); // 4 shots/second
        
        while (DateTime.Now < endTime)
        {
            await ShootAtRandomFish();
            _stats.TotalShots++;
            
            // Occasionally adjust bet value
            if (_rng.NextDouble() < 0.05) // 5% chance
            {
                var newBet = _rng.Next(1, 21) * 10; // 10-200 credits
                await _connection.InvokeAsync("SetBetValue", newBet);
            }
            
            await Task.Delay(shotInterval);
        }
        
        Console.WriteLine($"[{_botId}] Finished playing. Stats: RTP={_stats.CalculateRTP():F2}%, Shots={_stats.TotalShots}");
    }
    
    private async Task ShootAtRandomFish()
    {
        // Generate random target coordinates within game bounds
        var x = _rng.Next(100, 1700);
        var y = _rng.Next(100, 800);
        
        var betValue = 10; // Default bet
        _stats.TotalWagered += betValue;
        
        await _connection.InvokeAsync("Fire", x, y, Guid.NewGuid().ToString());
    }
    
    private void RecordPayout(PayoutEvent payout)
    {
        _stats.TotalWon += payout.Amount;
        _stats.FishKillCounts[payout.FishType] = 
            _stats.FishKillCounts.GetValueOrDefault(payout.FishType, 0) + 1;
        
        Console.WriteLine($"[{_botId}] Killed fish type {payout.FishType} for {payout.Amount} credits");
    }
}
```

### 5.2 Multi-Bot Test Runner

```csharp
public class RTPValidationRunner
{
    private List<OceanKingBot> _bots = new();
    private readonly string _hubUrl;
    
    public RTPValidationRunner(string hubUrl = "http://localhost:8080/gamehub")
    {
        _hubUrl = hubUrl;
    }
    
    public async Task RunRTPValidation(int botCount, int hoursToRun)
    {
        Console.WriteLine($"Starting RTP validation with {botCount} bots for {hoursToRun} hours");
        
        // Create and connect bots
        var connectionTasks = new List<Task>();
        for (int i = 0; i < botCount; i++)
        {
            var bot = new OceanKingBot();
            _bots.Add(bot);
            
            // Stagger connections to avoid overwhelming server
            await Task.Delay(100);
            
            connectionTasks.Add(bot.ConnectAsync(_hubUrl, $"Bot{i}"));
        }
        
        await Task.WhenAll(connectionTasks);
        Console.WriteLine($"All {botCount} bots connected");
        
        // Distribute bots across rooms and seats
        var playTasks = new List<Task>();
        var roomsNeeded = (botCount + 5) / 6; // 6 seats per room
        
        for (int roomIndex = 0; roomIndex < roomsNeeded; roomIndex++)
        {
            var roomId = $"bot_test_room_{roomIndex}";
            
            for (int seat = 1; seat <= 6 && (_bots.Count > roomIndex * 6 + seat - 1); seat++)
            {
                var botIndex = roomIndex * 6 + seat - 1;
                var bot = _bots[botIndex];
                
                playTasks.Add(bot.JoinRoomAndPlay(roomId, seat, hoursToRun * 60));
            }
        }
        
        await Task.WhenAll(playTasks);
        
        // Aggregate and report statistics
        var report = GenerateRTPReport();
        await File.WriteAllTextAsync($"RTP_Report_{DateTime.Now:yyyyMMdd_HHmmss}.json", report);
        
        Console.WriteLine("RTP Validation Complete. Report generated.");
    }
    
    private string GenerateRTPReport()
    {
        var aggregateStats = new
        {
            TotalBots = _bots.Count,
            TotalShots = _bots.Sum(b => b.Statistics.TotalShots),
            TotalWagered = _bots.Sum(b => b.Statistics.TotalWagered),
            TotalWon = _bots.Sum(b => b.Statistics.TotalWon),
            OverallRTP = (_bots.Sum(b => b.Statistics.TotalWon) / 
                         _bots.Sum(b => b.Statistics.TotalWagered)) * 100,
            
            PerFishTypeStats = CalculatePerFishStats(),
            
            IndividualBotRTPs = _bots.Select(b => new
            {
                BotId = b.BotId,
                RTP = b.Statistics.CalculateRTP(),
                Shots = b.Statistics.TotalShots
            }),
            
            StatisticalAnalysis = new
            {
                Mean = CalculateMeanRTP(),
                StdDev = CalculateStdDevRTP(),
                Min = _bots.Min(b => b.Statistics.CalculateRTP()),
                Max = _bots.Max(b => b.Statistics.CalculateRTP()),
                ConfidenceInterval95 = CalculateConfidenceInterval()
            }
        };
        
        return JsonSerializer.Serialize(aggregateStats, new JsonSerializerOptions 
        { 
            WriteIndented = true 
        });
    }
}
```

### 5.3 Statistical Validation

```csharp
public class RTPValidator
{
    public class ValidationResult
    {
        public bool Passed { get; set; }
        public decimal ActualRTP { get; set; }
        public decimal ExpectedRTP { get; set; }
        public decimal Deviation { get; set; }
        public decimal ConfidenceLower { get; set; }
        public decimal ConfidenceUpper { get; set; }
        public string Message { get; set; }
    }
    
    public ValidationResult ValidateRTP(
        decimal totalWon, 
        decimal totalWagered, 
        decimal expectedRTP, 
        int totalShots)
    {
        var actualRTP = (totalWon / totalWagered) * 100;
        var deviation = Math.Abs(actualRTP - expectedRTP);
        
        // Calculate 95% confidence interval based on shot count
        var standardError = CalculateStandardError(expectedRTP, totalShots);
        var marginOfError = 1.96m * standardError; // 95% CI
        
        var confidenceLower = expectedRTP - marginOfError;
        var confidenceUpper = expectedRTP + marginOfError;
        
        var passed = actualRTP >= confidenceLower && actualRTP <= confidenceUpper;
        
        return new ValidationResult
        {
            Passed = passed,
            ActualRTP = actualRTP,
            ExpectedRTP = expectedRTP,
            Deviation = deviation,
            ConfidenceLower = confidenceLower,
            ConfidenceUpper = confidenceUpper,
            Message = passed 
                ? $"✅ RTP validation PASSED: {actualRTP:F2}% is within expected range [{confidenceLower:F2}%, {confidenceUpper:F2}%]"
                : $"❌ RTP validation FAILED: {actualRTP:F2}% is outside expected range [{confidenceLower:F2}%, {confidenceUpper:F2}%]"
        };
    }
    
    private decimal CalculateStandardError(decimal rtp, int sampleSize)
    {
        // Simplified standard error calculation for RTP
        // Assumes medium volatility (standard deviation ~5.6)
        var volatility = 5.6m;
        return volatility / (decimal)Math.Sqrt(sampleSize);
    }
}
```

---

## 6. Detailed Task List

### Phase 1: Initial Setup & Cleanup (2 hours)
1. **Kill stuck processes** - Clear ports 5000 and 8080
2. **Configure code quality tools** - Setup Prettier, ESLint, add npm scripts
3. **Remove TypeScript dead code** - Clean unused methods and proxy config
4. **Remove C# dead code** - Delete unused database layer and obsolete methods
5. **Fix localhost hardcoding** - Implement environment variable support

### Phase 2: Asset Creation Pipeline (4 hours)
6. **Create asset requirement spreadsheet** - Build comprehensive tracking document
7. **Generate fish sprites with CGDream** - Create all 8 fish types with animations
8. **Process sprites into spritesheets** - Use TexturePacker for optimization
9. **Generate effect sprites** - Coins, particles, death effects
10. **Organize asset file structure** - Setup proper directory hierarchy

### Phase 3: Animation Implementation (6 hours)
11. **Implement Phaser spritesheet system** - Load and configure animations
12. **Add directional rotation logic** - Fish face swimming direction
13. **Enhance death animation sequence** - Flash, scale, fade effects
14. **Create coin animation sprites** - Golden/silver spinning coins
15. **Implement coin arc trajectory** - Bezier curve to player bank
16. **Create payout text effects** - Floating damage numbers
17. **Add particle effects system** - Bubbles, sparkles, shockwaves

### Phase 4: Testing Framework (4 hours)
18. **Setup testing frameworks** - xUnit for C#, Vitest for TypeScript
19. **Write C# unit tests** - Game mechanics, RTP, collision
20. **Write C# integration tests** - Match instance, SignalR hub
21. **Write TypeScript unit tests** - Animations, game state
22. **Write TypeScript integration tests** - SignalR communication
23. **Write E2E gameplay tests** - Complete game flows

### Phase 5: RTP Bot Testing (6 hours)
24. **Build bot client framework** - C# SignalR bot with statistics
25. **Implement multi-bot runner** - Spawn and coordinate multiple bots
26. **Create RTP validation engine** - Statistical analysis tools
27. **Write bot behavior patterns** - Random shooting, targeting modes
28. **Generate RTP reports** - Aggregate statistics and analysis
29. **Run million-shot validation** - Verify RTP convergence

### Phase 6: Quality Assurance (2 hours)
30. **Run code quality checks** - ESLint, Prettier
31. **Configure coverage reporting** - 80% target
32. **Create asset documentation** - Sprite requirements, prompts
33. **Update project documentation** - Architecture, testing, workflows
34. **Final validation** - Restart workflows, run all tests

---

## 7. Asset Requirement Spreadsheet

| Asset ID | Type | Name | Animation States | Frame Count | Resolution | Status | CGDream Prompt | Notes |
|----------|------|------|-----------------|-------------|------------|--------|----------------|-------|
| FISH_001 | Fish | Clownfish | Swim, Idle, Turn, Death | 8, 4, 4, 6 | 64x32 | Pending | "Sprite sheet of cute clownfish..." | Small fish, type 0 |
| FISH_002 | Fish | Neon Tetra | Swim, Idle, Turn, Death | 8, 4, 4, 6 | 64x32 | Pending | "Sprite sheet of neon tetra..." | Small fish, type 1 |
| FISH_003 | Fish | Butterflyfish | Swim, Idle, Turn, Death | 8, 4, 4, 6 | 64x32 | Pending | "Sprite sheet of yellow butterflyfish..." | Small fish, type 2 |
| FISH_004 | Fish | Lionfish | Swim, Idle, Turn, Death | 8, 4, 4, 6 | 96x48 | Pending | "Sprite sheet of lionfish enemy..." | Medium fish, type 6 |
| FISH_005 | Fish | Triggerfish | Swim, Idle, Turn, Death | 8, 4, 4, 6 | 96x48 | Pending | "Sprite sheet of triggerfish..." | Medium fish, type 9 |
| FISH_006 | Fish | Hammerhead | Swim, Idle, Turn, Death | 8, 4, 4, 6 | 128x64 | Pending | "Sprite sheet of hammerhead shark..." | Large boss, type 12 |
| FISH_007 | Fish | Manta Ray | Swim, Idle, Turn, Death | 8, 4, 4, 6 | 128x64 | Pending | "Sprite sheet of giant manta ray..." | Large boss, type 14 |
| FISH_008 | Fish | Wave Rider | Swim, Idle, Turn, Death | 8, 4, 4, 6 | 96x48 | Pending | "Sprite sheet of magical wave rider..." | Bonus fish, type 21 |
| FX_001 | Effect | Gold Coin | Spin | 8 | 32x32 | Pending | "Sprite sheet of spinning gold coin..." | Own kill rewards |
| FX_002 | Effect | Silver Coin | Spin | 8 | 24x24 | Pending | "Sprite sheet of spinning silver coin..." | Other player rewards |
| FX_003 | Effect | Bubbles | Burst | 6 | 64x64 | Pending | "Sprite sheet of bubble burst..." | Death effect |
| FX_004 | Effect | Sparkles | Glitter | 8 | 32x32 | Pending | "Sprite sheet of golden sparkle..." | Big win effect |
| FX_005 | Effect | Shockwave | Expand | 6 | 128x128 | Pending | "Sprite sheet of water shockwave..." | Boss death |
| UI_001 | UI | Numbers | Static | 10 | 32x48 | Pending | "Bitmap font numbers 0-9 golden..." | Payout display |
| UI_002 | UI | Crosshair | Pulse | 4 | 64x64 | Pending | "Animated crosshair target..." | Auto-target indicator |

---

## 8. Implementation Timeline

### Week 1: Foundation (Days 1-7)
- **Day 1-2:** Code cleanup, quality tools setup
- **Day 3-4:** Asset generation and processing
- **Day 5-7:** Basic animation implementation

### Week 2: Animation & Effects (Days 8-14)
- **Day 8-9:** Complete animation system
- **Day 10-11:** Particle effects and coin animations
- **Day 12-14:** Payout text and visual polish

### Week 3: Testing Infrastructure (Days 15-21)
- **Day 15-16:** Testing framework setup
- **Day 17-18:** Unit and integration tests
- **Day 19-21:** Bot framework development

### Week 4: Validation & Polish (Days 22-28)
- **Day 22-24:** RTP bot testing and validation
- **Day 25-26:** Performance optimization
- **Day 27-28:** Final QA and documentation

---

## Success Metrics

### Code Quality
- ✅ Zero ESLint errors
- ✅ 100% Prettier compliance  
- ✅ No dead code remaining
- ✅ Environment variables for configuration

### Animation Quality
- ✅ All 8 fish types fully animated
- ✅ Smooth rotation and directional facing
- ✅ Death animations trigger correctly
- ✅ Coins reach correct player bank
- ✅ Payout text displays at fish position
- ✅ 60 FPS maintained with all effects

### Testing Coverage
- ✅ 80%+ code coverage on critical paths
- ✅ All unit tests passing
- ✅ Integration tests validate SignalR
- ✅ E2E tests confirm full gameplay

### RTP Validation
- ✅ 1,000,000+ automated shots completed
- ✅ Actual RTP within ±0.5% of theoretical
- ✅ Per-fish capture rates validated
- ✅ Boss progressive mechanics confirmed
- ✅ Hot seat multipliers detected

---

## Risk Mitigation

### Technical Risks
- **Asset Generation Quality:** Generate multiple variations, select best
- **Performance Impact:** Profile animations, use object pooling
- **SignalR Stability:** Implement reconnection logic, test under load
- **RTP Deviation:** Run longer tests if initial results vary

### Timeline Risks  
- **Asset Creation Delays:** Start with placeholder sprites if needed
- **Testing Complexity:** Prioritize critical path tests first
- **Bot Development:** Use simple random behavior initially

### Quality Risks
- **Animation Smoothness:** Test on various devices/browsers
- **Visual Consistency:** Maintain art style guide
- **Code Regression:** Run tests after each major change

---

## Conclusion

This comprehensive plan transforms Ocean King 3 into a production-ready casino game with:
- Professional animation and visual effects
- Rigorous testing and RTP validation
- Clean, maintainable codebase
- Automated quality assurance
- Statistical proof of fairness

The combination of artistic polish, technical excellence, and mathematical validation ensures the game meets both player expectations and regulatory requirements.

**Total Estimated Time:** 28 days (full implementation)
**Priority Quick Win:** 7 days (core animations + basic testing)

---

*Document Version: 1.0*  
*Last Updated: November 2024*  
*Author: Development Team*