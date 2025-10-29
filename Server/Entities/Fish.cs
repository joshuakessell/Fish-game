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
            VelocityY = velocityY
        };
        
        // Configure based on type with proper crossing speeds and destruction odds
        // Destruction odds calculated for exactly 90% RTP with high-volatility multipliers
        // Formula: P = 0.90 / (BaseValue × AvgMultiplier)
        // AvgMultiplier = 1.74 (1x×70% + 2x×15% + 3x×8% + 5x×5% + 10x×1.5% + 20x×0.5%)
        switch (typeId)
        {
            case 0: // Small fish - precise odds for 90% RTP
                fish.BaseValue = 5m;
                fish.DestructionOdds = 0.90f / (5f * 1.74f); // 0.10344828...
                fish.HitboxRadius = 20f;
                fish.DespawnTick = currentTick + 600; // 20 seconds max lifetime
                break;
                
            case 1: // Medium fish - precise odds for 90% RTP
                fish.BaseValue = 15m;
                fish.DestructionOdds = 0.90f / (15f * 1.74f); // 0.03448276...
                fish.HitboxRadius = 30f;
                fish.DespawnTick = currentTick + 900; // 30 seconds max lifetime
                break;
                
            case 2: // Large fish - precise odds for 90% RTP
                fish.BaseValue = 50m;
                fish.DestructionOdds = 0.90f / (50f * 1.74f); // 0.01034483...
                fish.HitboxRadius = 50f;
                fish.DespawnTick = currentTick + 1200; // 40 seconds max lifetime
                break;
                
            case 3: // Boss fish - precise odds for 90% RTP
                fish.BaseValue = 500m;
                fish.DestructionOdds = 0.90f / (500f * 1.74f); // 0.00103448...
                fish.HitboxRadius = 80f;
                fish.DespawnTick = currentTick + 1800; // 60 seconds max lifetime
                fish.IsExplosive = true;
                break;
                
            // SPECIAL RARE CREATURES - Medium-High Value
            
            case 4: // Sea Turtle - slow gentle curves
                fish.BaseValue = 25m;
                fish.DestructionOdds = 0.90f / (25f * 1.74f); // 0.02068966...
                fish.HitboxRadius = 45f;
                fish.DespawnTick = currentTick + 1500; // 50 seconds max lifetime
                fish.PathCurveIntensity = 0.3f;
                fish.PathCurveDirection = Random.Shared.Next(2) == 0 ? 1f : -1f;
                break;
                
            case 5: // Manta Ray - graceful swooping
                fish.BaseValue = 35m;
                fish.DestructionOdds = 0.90f / (35f * 1.74f); // 0.01477833...
                fish.HitboxRadius = 55f;
                fish.DespawnTick = currentTick + 1400; // 47 seconds max lifetime
                fish.PathCurveIntensity = 0.5f;
                fish.PathCurveDirection = Random.Shared.Next(2) == 0 ? 1f : -1f;
                break;
                
            case 6: // Giant Jellyfish - pulsing vertical curves
                fish.BaseValue = 30m;
                fish.DestructionOdds = 0.90f / (30f * 1.74f); // 0.01724138...
                fish.HitboxRadius = 48f;
                fish.DespawnTick = currentTick + 1350; // 45 seconds max lifetime
                fish.PathCurveIntensity = 0.4f;
                fish.PathCurveDirection = Random.Shared.Next(2) == 0 ? 1f : -1f;
                break;
                
            case 7: // Hammerhead Shark - predatory curves
                fish.BaseValue = 40m;
                fish.DestructionOdds = 0.90f / (40f * 1.74f); // 0.01293103...
                fish.HitboxRadius = 52f;
                fish.DespawnTick = currentTick + 1450; // 48 seconds max lifetime
                fish.PathCurveIntensity = 0.45f;
                fish.PathCurveDirection = Random.Shared.Next(2) == 0 ? 1f : -1f;
                break;
                
            case 8: // Nautilus - spiral curves
                fish.BaseValue = 28m;
                fish.DestructionOdds = 0.90f / (28f * 1.74f); // 0.01848962...
                fish.HitboxRadius = 42f;
                fish.DespawnTick = currentTick + 1300; // 43 seconds max lifetime
                fish.PathCurveIntensity = 0.6f;
                fish.PathCurveDirection = Random.Shared.Next(2) == 0 ? 1f : -1f;
                break;
        }

        return fish;
    }

    public void UpdatePosition(float deltaTime, long currentTick)
    {
        float timeSinceSpawn = (currentTick - SpawnTick) / 30f;
        
        // Apply curved path for special fish (types 4-8)
        if (TypeId >= 4 && TypeId <= 8 && PathCurveIntensity > 0)
        {
            ApplyCurvedPath(timeSinceSpawn, deltaTime);
        }
        else
        {
            // Base movement for regular fish
            X += VelocityX * deltaTime;
            Y += VelocityY * deltaTime;
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
        
        // Get original velocity magnitude
        float speed = MathF.Sqrt(VelocityX * VelocityX + VelocityY * VelocityY);
        
        // Get base angle from initial velocity
        float baseAngle = MathF.Atan2(VelocityY, VelocityX);
        
        // Apply curve to angle
        float newAngle = baseAngle + currentAngle;
        
        // Update position with curved velocity
        X += MathF.Cos(newAngle) * speed * deltaTime;
        Y += MathF.Sin(newAngle) * speed * deltaTime;
        
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
