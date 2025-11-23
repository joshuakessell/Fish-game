using OceanKing.Server.Systems.Paths;
using OceanKing.Server.Models;

namespace OceanKing.Server.Entities;

public class Fish
{
    public string FishId { get; set; } = Guid.NewGuid().ToString();
    public int TypeId { get; set; } // 0=small, 1=medium, 2=large, 3=boss
    public decimal BaseValue { get; set; }
    public float DestructionOdds { get; set; } // Probability (0-1) that a bullet destroys this fish
    
    // Position and movement
    public float X { get; set; }
    public float Y { get; set; }
    public float VelocityX { get; set; }
    public float VelocityY { get; set; }
    public float HitboxRadius { get; set; }
    
    // Path-based movement (NEW SYSTEM)
    public IPath? Path { get; set; }
    public Models.PathData? CachedPathData { get; set; } // Cached to avoid per-tick allocation
    
    // Smooth speed control for lifelike swimming
    public float BaseSpeed { get; set; } // Target speed
    public float CurrentSpeed { get; set; } // Actual current speed (smoothly interpolates)
    public float AccelerationProgress { get; set; } // 0-1, how far into acceleration
    
    // Timing
    public long SpawnTick { get; set; }
    public long DespawnTick { get; set; }
    public int MovementPatternId { get; set; }
    
    // Special properties
    public bool IsExplosive { get; set; }
    public bool IsChainLightningEligible { get; set; } = true;
    
    // Group movement patterns
    public string? GroupId { get; set; }
    public int GroupIndex { get; set; }
    public int GroupSize { get; set; }
    public int GroupPattern { get; set; } // 0=none, 1=blooming, 2=symmetrical wave, 3=circle
    
    // Curved path tracking for special fish
    public float PathCurveIntensity { get; set; }
    public float PathCurveDirection { get; set; } // 1 or -1

    public static Fish CreateFish(int typeId, float x, float y, long currentTick, float velocityX, float velocityY, int movementPattern = 0)
    {
        // Lookup fish definition from catalog
        var fishDef = FishCatalog.GetFish(typeId);
        if (fishDef == null)
        {
            throw new ArgumentException($"Invalid fish type ID: {typeId}");
        }
        
        // Generate stable fish ID hash for path generation
        var fishIdGuid = Guid.NewGuid().ToString();
        var fishIdHash = Math.Abs(fishIdGuid.GetHashCode());
        
        // Generate parametric path for this fish
        var path = PathGenerator.GeneratePathForFish(
            fishIdHash,
            fishDef,
            (int)currentTick
        );
        
        // Get initial position from path
        var startPos = path.GetPosition(0f);
        
        // Cache path data to avoid per-tick allocations
        var pathData = path.GetPathData();
        
        var fish = new Fish
        {
            FishId = fishIdGuid,
            TypeId = typeId,
            X = startPos[0],
            Y = startPos[1],
            SpawnTick = currentTick,
            MovementPatternId = movementPattern,
            VelocityX = velocityX,
            VelocityY = velocityY,
            BaseSpeed = fishDef.BaseSpeed,
            CurrentSpeed = 0f, // Start at 0, will accelerate smoothly
            AccelerationProgress = 0f,
            HitboxRadius = fishDef.HitboxRadius,
            Path = path, // Store the path for client synchronization
            CachedPathData = pathData // Cache for performance
        };
        
        // Set BaseValue (payout multiplier from catalog)
        fish.BaseValue = fishDef.PayoutMultiplier;
        
        // Set DestructionOdds (capture probability from catalog)
        fish.DestructionOdds = fishDef.CaptureProbability;
        
        // Set despawn time based on category
        switch (fishDef.Category)
        {
            case FishCategory.SmallFish:
                fish.DespawnTick = currentTick + 600; // 20 seconds
                break;
            case FishCategory.MediumFish:
                fish.DespawnTick = currentTick + 900; // 30 seconds
                break;
            case FishCategory.LargeFish:
                fish.DespawnTick = currentTick + 1200; // 40 seconds
                break;
            case FishCategory.HighValueFish:
                fish.DespawnTick = currentTick + 1500; // 50 seconds
                break;
            case FishCategory.SpecialItems:
                fish.DespawnTick = currentTick + 1800; // 60 seconds
                break;
            case FishCategory.BossFish:
                fish.DespawnTick = currentTick + 2400; // 80 seconds
                fish.IsExplosive = true; // Boss fish trigger events
                break;
        }
        
        // Large fish, high-value fish, special items, and bosses get curved paths
        if (fishDef.Category == FishCategory.LargeFish ||
            fishDef.Category == FishCategory.HighValueFish ||
            fishDef.Category == FishCategory.SpecialItems ||
            fishDef.Category == FishCategory.BossFish)
        {
            fish.PathCurveIntensity = 0.3f + (Random.Shared.NextSingle() * 0.2f); // 0.3 to 0.5
            fish.PathCurveDirection = Random.Shared.Next(2) == 0 ? 1f : -1f;
        }
        
        return fish;
    }

    public void UpdatePosition(float deltaTime, long currentTick)
    {
        // NEW PATH-BASED MOVEMENT SYSTEM
        if (Path != null && CachedPathData != null)
        {
            // Calculate time progress along the path
            float ticksSinceSpawn = currentTick - SpawnTick;
            float pathDuration = CachedPathData.Duration * 30f; // Convert seconds to ticks
            
            // Normalize time (0.0 to 1.0)
            float t = pathDuration > 0 ? ticksSinceSpawn / pathDuration : 0f;
            
            // Handle looping paths
            if (CachedPathData.Loop && t > 1f)
            {
                t = t % 1f;
            }
            else if (t > 1f)
            {
                t = 1f; // Clamp to end of path
            }
            
            // Get position from path
            var pos = Path.GetPosition(t);
            X = pos[0];
            Y = pos[1];
            
            return; // Skip legacy movement code
        }
        
        // LEGACY MOVEMENT CODE (fallback for old fish)
        float timeSinceSpawn = (currentTick - SpawnTick) / 30f;
        
        // Smooth acceleration - fish ease into their swimming speed over 2 seconds
        if (AccelerationProgress < 1f)
        {
            AccelerationProgress = MathF.Min(1f, AccelerationProgress + deltaTime * 0.5f); // 2 seconds to full speed
            // Use smooth ease-out curve for natural acceleration
            float easedProgress = 1f - MathF.Pow(1f - AccelerationProgress, 3f);
            CurrentSpeed = BaseSpeed * easedProgress;
        }
        else
        {
            CurrentSpeed = BaseSpeed;
        }
        
        // Apply curved path if fish has one (set in CreateFish based on category)
        if (PathCurveIntensity > 0)
        {
            ApplyCurvedPath(timeSinceSpawn, deltaTime);
        }
        else
        {
            // Base movement for regular fish
            float velocityMagnitude = MathF.Sqrt(VelocityX * VelocityX + VelocityY * VelocityY);
            if (velocityMagnitude > 0)
            {
                float normalizedVX = VelocityX / velocityMagnitude;
                float normalizedVY = VelocityY / velocityMagnitude;
                X += normalizedVX * CurrentSpeed * deltaTime;
                Y += normalizedVY * CurrentSpeed * deltaTime;
            }
        }
        
        // Apply group patterns if part of a group
        if (!string.IsNullOrEmpty(GroupId) && GroupSize > 1)
        {
            ApplyGroupPattern(timeSinceSpawn);
        }
    }
    
    private void ApplyCurvedPath(float timeSinceSpawn, float deltaTime)
    {
        // Smooth curved path that changes direction gradually (max ~100 degrees total curve)
        // The curve intensity determines how much the path bends
        
        float curveProgress = MathF.Min(timeSinceSpawn / 20f, 1f); // Full curve over 20 seconds
        float maxCurveAngle = 1.75f; // ~100 degrees in radians
        
        // Calculate current angle based on curve progress
        float currentAngle = MathF.Sin(curveProgress * MathF.PI) * maxCurveAngle * PathCurveIntensity * PathCurveDirection;
        
        // Get base angle from initial velocity
        float baseAngle = MathF.Atan2(VelocityY, VelocityX);
        
        // Apply curve to angle
        float newAngle = baseAngle + currentAngle;
        
        // Calculate turning rate (how fast the angle is changing)
        float turningRate = MathF.Abs(MathF.Cos(curveProgress * MathF.PI) * maxCurveAngle * PathCurveIntensity);
        
        // Slow down when turning sharply, speed up on straights
        float speedMultiplier = 1f - (turningRate * 0.3f); // Up to 30% slower when turning
        speedMultiplier = MathF.Max(speedMultiplier, 0.7f); // Never slower than 70%
        
        // Update position with curved velocity and speed variation
        float effectiveSpeed = CurrentSpeed * speedMultiplier;
        X += MathF.Cos(newAngle) * effectiveSpeed * deltaTime;
        Y += MathF.Sin(newAngle) * effectiveSpeed * deltaTime;
    }
    
    private void ApplyGroupPattern(float timeSinceSpawn)
    {
        float groupPhase = timeSinceSpawn * 2f;
        
        switch (GroupPattern)
        {
            case 1: // Blooming pattern - fish spread out then come back together
                float bloomRadius = MathF.Sin(groupPhase * 0.5f) * 30f;
                float angleOffset = (GroupIndex / (float)GroupSize) * MathF.PI * 2f;
                X += MathF.Cos(angleOffset) * bloomRadius * 0.1f;
                Y += MathF.Sin(angleOffset) * bloomRadius;
                break;
                
            case 2: // Symmetrical wave - fish move in synchronized wave pattern
                if (GroupIndex % 2 == 0)
                {
                    Y += MathF.Sin(groupPhase) * 15f;
                }
                else
                {
                    Y -= MathF.Sin(groupPhase) * 15f;
                }
                break;
                
            case 3: // Circle formation - fish rotate around center point
                float circleAngle = groupPhase + (GroupIndex / (float)GroupSize) * MathF.PI * 2f;
                X += MathF.Cos(circleAngle) * 20f * deltaTime;
                Y += MathF.Sin(circleAngle) * 20f * deltaTime;
                break;
        }
    }
    
    private float deltaTime = 1f / 30f; // Approximate for calculation
}
