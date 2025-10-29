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
        var fish = new Fish
        {
            TypeId = typeId,
            X = x,
            Y = y,
            SpawnTick = currentTick,
            MovementPatternId = movementPattern,
            VelocityX = velocityX,
            VelocityY = velocityY,
            BaseSpeed = MathF.Sqrt(velocityX * velocityX + velocityY * velocityY),
            CurrentSpeed = 0f, // Start at 0, will accelerate smoothly
            AccelerationProgress = 0f
        };
        
        // Configure based on type with proper crossing speeds and destruction odds
        // Destruction odds calculated for exactly 97% RTP with high-volatility multipliers
        // Formula: P = 0.97 / (BaseValue × AvgMultiplier)
        // AvgMultiplier = 1.74 (1x×70% + 2x×15% + 3x×8% + 5x×5% + 10x×1.5% + 20x×0.5%)
        switch (typeId)
        {
            // OCEAN KING 3 STANDARD FISH (Types 0-8)
            
            case 0: // Flying Fish - 2x multiplier
                fish.BaseValue = 2m;
                fish.DestructionOdds = 0.97f / (2f * 1.74f); // 97% RTP
                fish.HitboxRadius = 15f;
                fish.DespawnTick = currentTick + 600; // 20 seconds max lifetime
                break;
                
            case 1: // Clown Fish - 3x multiplier
                fish.BaseValue = 3m;
                fish.DestructionOdds = 0.97f / (3f * 1.74f); // 97% RTP
                fish.HitboxRadius = 18f;
                fish.DespawnTick = currentTick + 600; // 20 seconds max lifetime
                break;
                
            case 2: // Butterfly Fish - 4x multiplier
                fish.BaseValue = 4m;
                fish.DestructionOdds = 0.97f / (4f * 1.74f); // 97% RTP
                fish.HitboxRadius = 20f;
                fish.DespawnTick = currentTick + 700; // 23 seconds max lifetime
                break;
                
            case 3: // Fugu - 5x multiplier
                fish.BaseValue = 5m;
                fish.DestructionOdds = 0.97f / (5f * 1.74f); // 97% RTP
                fish.HitboxRadius = 22f;
                fish.DespawnTick = currentTick + 700; // 23 seconds max lifetime
                break;
                
            case 4: // Lionfish - 6x multiplier
                fish.BaseValue = 6m;
                fish.DestructionOdds = 0.97f / (6f * 1.74f); // 97% RTP
                fish.HitboxRadius = 25f;
                fish.DespawnTick = currentTick + 800; // 27 seconds max lifetime
                break;
                
            case 5: // Flatfish - 8x multiplier
                fish.BaseValue = 8m;
                fish.DestructionOdds = 0.97f / (8f * 1.74f); // 97% RTP
                fish.HitboxRadius = 28f;
                fish.DespawnTick = currentTick + 800; // 27 seconds max lifetime
                break;
                
            case 6: // Lobster - 10x multiplier
                fish.BaseValue = 10m;
                fish.DestructionOdds = 0.97f / (10f * 1.74f); // 97% RTP
                fish.HitboxRadius = 30f;
                fish.DespawnTick = currentTick + 900; // 30 seconds max lifetime
                break;
                
            case 7: // Spearfish - 12x multiplier
                fish.BaseValue = 12m;
                fish.DestructionOdds = 0.97f / (12f * 1.74f); // 97% RTP
                fish.HitboxRadius = 32f;
                fish.DespawnTick = currentTick + 900; // 30 seconds max lifetime
                break;
                
            case 8: // Octopus - 15x multiplier
                fish.BaseValue = 15m;
                fish.DestructionOdds = 0.97f / (15f * 1.74f); // 97% RTP
                fish.HitboxRadius = 35f;
                fish.DespawnTick = currentTick + 1000; // 33 seconds max lifetime
                break;
                
            // Types 9-19 are ultra-rare bosses (defined in BossCatalog.cs)
            
            // OCEAN KING 3 EXTENDED FISH (Types 20-27)
            
            case 20: // Lantern Fish - 18x multiplier
                fish.BaseValue = 18m;
                fish.DestructionOdds = 0.97f / (18f * 1.74f); // 97% RTP
                fish.HitboxRadius = 38f;
                fish.DespawnTick = currentTick + 1100; // 37 seconds max lifetime
                break;
                
            case 21: // Sea Turtle - 25x multiplier
                fish.BaseValue = 25m;
                fish.DestructionOdds = 0.97f / (25f * 1.74f); // 97% RTP
                fish.HitboxRadius = 45f;
                fish.DespawnTick = currentTick + 1200; // 40 seconds max lifetime
                fish.PathCurveIntensity = 0.3f;
                fish.PathCurveDirection = Random.Shared.Next(2) == 0 ? 1f : -1f;
                break;
                
            case 22: // Saw Shark - 30x multiplier
                fish.BaseValue = 30m;
                fish.DestructionOdds = 0.97f / (30f * 1.74f); // 97% RTP
                fish.HitboxRadius = 50f;
                fish.DespawnTick = currentTick + 1300; // 43 seconds max lifetime
                fish.PathCurveIntensity = 0.35f;
                fish.PathCurveDirection = Random.Shared.Next(2) == 0 ? 1f : -1f;
                break;
                
            case 23: // Devilfish - 35x multiplier
                fish.BaseValue = 35m;
                fish.DestructionOdds = 0.97f / (35f * 1.74f); // 97% RTP
                fish.HitboxRadius = 55f;
                fish.DespawnTick = currentTick + 1400; // 47 seconds max lifetime
                fish.PathCurveIntensity = 0.4f;
                fish.PathCurveDirection = Random.Shared.Next(2) == 0 ? 1f : -1f;
                break;
                
            case 24: // Jumbo Fish - 40x multiplier
                fish.BaseValue = 40m;
                fish.DestructionOdds = 0.97f / (40f * 1.74f); // 97% RTP
                fish.HitboxRadius = 60f;
                fish.DespawnTick = currentTick + 1500; // 50 seconds max lifetime
                break;
                
            case 25: // Shark - 60x multiplier
                fish.BaseValue = 60m;
                fish.DestructionOdds = 0.97f / (60f * 1.74f); // 97% RTP
                fish.HitboxRadius = 70f;
                fish.DespawnTick = currentTick + 1600; // 53 seconds max lifetime
                fish.PathCurveIntensity = 0.5f;
                fish.PathCurveDirection = Random.Shared.Next(2) == 0 ? 1f : -1f;
                break;
                
            case 26: // Killer Whale - 100x multiplier
                fish.BaseValue = 100m;
                fish.DestructionOdds = 0.97f / (100f * 1.74f); // 97% RTP
                fish.HitboxRadius = 85f;
                fish.DespawnTick = currentTick + 1700; // 57 seconds max lifetime
                fish.PathCurveIntensity = 0.4f;
                fish.PathCurveDirection = Random.Shared.Next(2) == 0 ? 1f : -1f;
                break;
                
            case 27: // Golden Dragon - 500x multiplier
                fish.BaseValue = 500m;
                fish.DestructionOdds = 0.97f / (500f * 1.74f); // 97% RTP
                fish.HitboxRadius = 100f;
                fish.DespawnTick = currentTick + 1800; // 60 seconds max lifetime
                fish.IsExplosive = true;
                break;
        }

        return fish;
    }

    public void UpdatePosition(float deltaTime, long currentTick)
    {
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
        
        // Apply curved path for special fish (types 4-8, 21-23, 25-26)
        bool hasCurvedPath = (TypeId >= 4 && TypeId <= 8) || 
                            (TypeId >= 21 && TypeId <= 23) || 
                            TypeId == 25 || TypeId == 26;
        
        if (hasCurvedPath && PathCurveIntensity > 0)
        {
            ApplyCurvedPath(timeSinceSpawn, deltaTime);
        }
        else
        {
            // Base movement for regular fish with speed variation
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
        
        // Apply individual movement patterns for regular fish
        if (TypeId < 4)
        {
            switch (MovementPatternId)
            {
                case 1: // Gentle sine wave
                    Y += MathF.Sin(timeSinceSpawn * 1.5f) * 2.5f;
                    break;
                    
                case 2: // Larger circular motion
                    if (TypeId >= 2)
                    {
                        float angle = timeSinceSpawn * 0.8f;
                        Y += MathF.Sin(angle) * 2.25f;
                        X += MathF.Cos(angle) * 1.5f;
                    }
                    else
                    {
                        Y += MathF.Sin(timeSinceSpawn * 2f) * 1.5f;
                    }
                    break;
                    
                case 3: // Spiral movement
                    float spiralAngle = timeSinceSpawn;
                    float spiralRadius = timeSinceSpawn * 5f;
                    Y += MathF.Sin(spiralAngle) * spiralRadius * 0.1f;
                    X += MathF.Cos(spiralAngle) * spiralRadius * 0.05f;
                    break;
            }
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
        
        // Add type-specific movement variations
        switch (TypeId)
        {
            case 4: // Sea Turtle - gentle bobbing
                Y += MathF.Sin(timeSinceSpawn * 0.8f) * 1.5f;
                break;
                
            case 5: // Manta Ray - graceful gliding swoops
                Y += MathF.Sin(timeSinceSpawn * 1.2f) * 2.8f;
                X += MathF.Cos(timeSinceSpawn * 0.6f) * 1.2f;
                break;
                
            case 6: // Jellyfish - pulsing vertical motion
                Y += MathF.Sin(timeSinceSpawn * 2.5f) * 3.5f;
                break;
                
            case 7: // Hammerhead - hunting sway
                X += MathF.Sin(timeSinceSpawn * 1.5f) * 2.0f;
                break;
                
            case 8: // Nautilus - gentle spiral addition
                float nautAngle = timeSinceSpawn * 0.5f;
                X += MathF.Cos(nautAngle) * 1.8f;
                Y += MathF.Sin(nautAngle) * 1.8f;
                break;
        }
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
