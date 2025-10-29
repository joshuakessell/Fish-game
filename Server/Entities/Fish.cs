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

    public static Fish CreateFish(int typeId, float x, float y, long currentTick, bool movingRight = true)
    {
        var fish = new Fish
        {
            TypeId = typeId,
            X = x,
            Y = y,
            SpawnTick = currentTick,
            MovementPatternId = Random.Shared.Next(0, 3)
        };

        // Direction multiplier (1 for right, -1 for left)
        float direction = movingRight ? 1f : -1f;
        
        // Configure based on type with proper crossing speeds and destruction odds
        // Destruction odds calculated for 95% RTP with high-volatility multipliers
        // Formula: P = 0.95 / (BaseValue × AvgMultiplier)
        // AvgMultiplier ≈ 1.74 (1x=70%, 2x=15%, 3x=8%, 5x=5%, 10x=1.5%, 20x=0.5%)
        switch (typeId)
        {
            case 0: // Small fish - 10.9% destruction chance per hit
                fish.BaseValue = 5m;
                fish.DestructionOdds = 0.109f;
                fish.HitboxRadius = 20f;
                fish.VelocityX = direction * (100f + Random.Shared.NextSingle() * 20f);
                fish.DespawnTick = currentTick + 600; // 20 seconds max lifetime
                break;
                
            case 1: // Medium fish - 3.6% destruction chance per hit
                fish.BaseValue = 15m;
                fish.DestructionOdds = 0.036f;
                fish.HitboxRadius = 30f;
                fish.VelocityX = direction * (60f + Random.Shared.NextSingle() * 10f);
                fish.DespawnTick = currentTick + 900; // 30 seconds max lifetime
                break;
                
            case 2: // Large fish - 1.1% destruction chance per hit
                fish.BaseValue = 50m;
                fish.DestructionOdds = 0.011f;
                fish.HitboxRadius = 50f;
                fish.VelocityX = direction * (45f + Random.Shared.NextSingle() * 10f);
                fish.DespawnTick = currentTick + 1200; // 40 seconds max lifetime
                break;
                
            case 3: // Boss fish - 0.11% destruction chance per hit (very rare!)
                fish.BaseValue = 500m;
                fish.DestructionOdds = 0.0011f;
                fish.HitboxRadius = 80f;
                fish.VelocityX = direction * (30f + Random.Shared.NextSingle() * 8f);
                fish.DespawnTick = currentTick + 1800; // 60 seconds max lifetime
                fish.IsExplosive = true;
                break;
        }

        // Add some vertical variation for movement patterns
        fish.VelocityY = (Random.Shared.NextSingle() - 0.5f) * 15f;

        return fish;
    }

    public void UpdatePosition(float deltaTime, long currentTick)
    {
        X += VelocityX * deltaTime;
        Y += VelocityY * deltaTime;

        float timeSinceSpawn = (currentTick - SpawnTick) / 30f;
        
        switch (MovementPatternId)
        {
            case 1: // Sine wave
                Y += MathF.Sin(timeSinceSpawn * 1.5f) * 2.5f;
                break;
                
            case 2: // Circular motion
                if (TypeId >= 2)
                {
                    float angle = timeSinceSpawn * 0.8f;
                    Y += MathF.Sin(angle) * 2.25f;
                }
                else
                {
                    Y += MathF.Sin(timeSinceSpawn * 2f) * 1.5f;
                }
                break;
        }
        
        // Keep fish on screen
        if (Y < 50) VelocityY = MathF.Abs(VelocityY);
        if (Y > 850) VelocityY = -MathF.Abs(VelocityY);
    }
}
